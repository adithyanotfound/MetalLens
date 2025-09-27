import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
from sqlalchemy import create_engine
import io
import logging
import os
from dotenv import load_dotenv

# ------------------------
# Load environment variables
# ------------------------
load_dotenv()
connection_string = os.getenv("DATABASE_URL")
CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", 10000))
PAGE_SIZE = int(os.getenv("PAGE_SIZE", 1000))
COPY_THRESHOLD = int(os.getenv("COPY_THRESHOLD", 1_000_000))

# ------------------------
# Logging configuration
# ------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

# ------------------------
# Expected ingestion columns
# ------------------------
EXPECTED_COLUMNS = [
    "station_name","agency_name","state_name","district_name",
    "date_collected","latitude","longitude","hpi","hei","completeness",
    "As","Cd","Cr","Cu","Fe","Pb","Mn","Hg","Ni","Zn",
    "Se","Al","Ba","Ag","B","U"
]

METALS = ["As","Cd","Cr","Cu","Fe","Pb","Mn","Hg","Ni","Zn","Se","Al","Ba","Ag","B","U"]

# All metal columns should be quoted for PostgreSQL
QUOTED_COLUMNS = [f'"{col}"' if col in METALS else col for col in EXPECTED_COLUMNS]

INSERT_QUERY = f"""
INSERT INTO groundwater_quality (
    {', '.join(QUOTED_COLUMNS)}
) VALUES %s
"""

# ------------------------
# Helper functions
# ------------------------

def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Normalize Excel column names - aggressive normalization."""
    df = df.copy()
    df.columns = df.columns.str.strip()
    
    normalized_mapping = {}
    for col in df.columns:
        normalized = (
            str(col).lower().strip()
            .replace('(', '_').replace(')', '_')
            .replace('/', '_').replace('-', '_')
            .replace(' ', '_').replace('%', 'percent')
            .replace('°', 'deg').replace('µ', 'micro')
            .replace(',', '_').replace('.', '_')
            .replace('+', '_plus_').replace('*', 'star_')
            .replace('__','_').strip('_')
        )
        normalized_mapping[col] = normalized
    
    df = df.rename(columns=normalized_mapping)
    return df

def map_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Map normalized Excel columns to ingestion schema."""
    logging.info(f"Available columns after normalization: {list(df.columns)}")

    column_mapping = {
        "station_name": "station_name",
        "agency_name": "agency_name", 
        "state_name": "state_name",
        "district_name": "district_name",
        "date_collection": "date_collected",
        "latitude": "latitude",
        "longitude": "longitude",

        "arsenic_mg_l": "As",
        "cadmium_mg_l": "Cd", 
        "chromium_mg_l": "Cr",
        "copper": "Cu",
        "iron_mg_l": "Fe",
        "lead_mg_l": "Pb",
        "manganese_mg_l": "Mn",
        "mercury_mg_l": "Hg",
        "nickel_mg_l": "Ni",
        "zinc_mg_l": "Zn",
        "selenium_mg_l": "Se",
        "aluminium": "Al",
        "barium": "Ba",
        "silver_mg_l": "Ag",
        "boron_mg_l": "B",
        "uranium": "U",

        "as": "As",
        "cd": "Cd", 
        "cr": "Cr",
        "cu": "Cu",
        "fe": "Fe",
        "pb": "Pb",
        "mn": "Mn",
        "hg": "Hg",
        "ni": "Ni",
        "zn": "Zn",
        "se": "Se",
        "al": "Al",
        "ba": "Ba",
        "ag": "Ag",
        "b": "B",
        "u": "U"
    }
    
    df = df.rename(columns=column_mapping)
    logging.info(f"Columns after mapping: {list(df.columns)}")
    return df

def validate_and_reorder(df: pd.DataFrame) -> pd.DataFrame:
    """Fill missing columns and drop rows with no metals."""
    for col in EXPECTED_COLUMNS:
        if col not in df.columns:
            df[col] = pd.NA
            logging.info(f"Added missing column '{col}' with NA values")

    metal_cols = [col for col in METALS if col in df.columns]
    logging.info(f"Available metal columns: {metal_cols}")

    if metal_cols:
        initial_rows = len(df)
        df = df.dropna(subset=metal_cols, how='all')
        logging.info(f"Dropped {initial_rows - len(df)} rows with no metal data")
    else:
        logging.warning("No metal columns found - keeping all rows")

    return df[EXPECTED_COLUMNS]

def clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Convert types, clean data, calculate HPI/HEI."""
    df = df.loc[:, ~df.columns.duplicated(keep='first')].copy()
    logging.info(f"After removing duplicate columns: {len(df.columns)} columns")

    if 'date_collected' in df.columns:
        # convert Excel year to integer
        df['date_collected'] = pd.to_numeric(df['date_collected'], errors='coerce')
        # create a proper date for each year
        df['date_collected'] = df['date_collected'].apply(
            lambda x: f"{int(x)}-01-01" if pd.notna(x) else None
        )
        logging.info(f"Converted date_collected: {df['date_collected'].notna().sum()} valid dates")


    for col in ['latitude', 'longitude']:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')
            logging.info(f"Converted {col}: {df[col].notna().sum()} valid values")

    for col in METALS + ['hpi','hei']:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')

    before_drop = len(df)
    df = df.dropna(subset=['latitude','longitude'])
    logging.info(f"Dropped {before_drop - len(df)} rows with missing latitude/longitude")

    # HPI and HEI calculation
    def calculate_indices(row):
        metals_present = row[METALS].notna()
        num_present = metals_present.sum()

        if num_present == 0:
            row['hpi'] = pd.NA
            row['hei'] = pd.NA
            row['completeness'] = 'none'
        else:
            row['hpi'] = row[METALS].sum(skipna=True) / num_present
            row['hei'] = row[METALS].sum(skipna=True) / num_present

            missing_metals = [m for m in METALS if pd.isna(row[m])]
            row['completeness'] = f"partial_missing_{'_'.join(missing_metals)}" if missing_metals else 'full'
        return row

    df = df.apply(calculate_indices, axis=1)
    logging.info("✓ HPI and HEI calculated")
    return df

# ------------------------
# Database insertion
# ------------------------
def copy_mode(df: pd.DataFrame, conn):
    df_clean = df.where(pd.notnull(df), None)
    buffer = io.StringIO()
    df_clean.to_csv(buffer, index=False, header=False, na_rep='\\N')
    buffer.seek(0)
    with conn.cursor() as cur:
        cur.copy_from(buffer, "groundwater_quality", sep=",", null='\\N', columns=QUOTED_COLUMNS)
    logging.info(f"COPY mode inserted {len(df)} rows")

def batch_insert_mode(df: pd.DataFrame, conn, chunk_size=CHUNK_SIZE, page_size=PAGE_SIZE):
    total_rows = len(df)
    inserted_rows = 0
    for start in range(0, total_rows, chunk_size):
        end = min(start + chunk_size, total_rows)
        chunk = df.iloc[start:end]
        chunk = chunk.where(pd.notnull(chunk), None)
        records = chunk.to_records(index=False)
        values = [tuple(v.item() if hasattr(v,'item') else v for v in r) for r in records]
        with conn.cursor() as cur:
            execute_values(cur, INSERT_QUERY, values, page_size=page_size)
        conn.commit()
        inserted_rows += len(values)
        logging.info(f"Inserted {inserted_rows}/{total_rows} rows")

# ------------------------
# Main pipeline
# ------------------------
def batch_insert_groundwater_data(df: pd.DataFrame, connection_string: str):
    logging.info(f"Starting ingestion pipeline with {len(df)} initial rows")
    logging.info(f"Original columns: {list(df.columns)}")

    df = normalize_columns(df)
    logging.info("✓ Column names normalized")
    df = map_columns(df)
    logging.info("✓ Columns mapped to schema")
    df = validate_and_reorder(df)
    logging.info("✓ Columns validated and reordered")
    df = clean_dataframe(df)
    logging.info("✓ Data types cleaned")

    total_rows = len(df[df['completeness'] != 'none'])
    if total_rows == 0:
        logging.error("No valid data remaining after processing!")
        return

    engine = create_engine(connection_string)
    try:
        with engine.begin() as conn:
            raw_conn = conn.connection
            if total_rows >= COPY_THRESHOLD:
                logging.info(f"Large dataset detected ({total_rows} rows). Using COPY mode.")
                copy_mode(df[df['completeness'] != 'none'], raw_conn)
            else:
                logging.info(f"Using batch insert mode for {total_rows} rows.")
                batch_insert_mode(df[df['completeness'] != 'none'], raw_conn)
        logging.info(f"✅ Successfully ingested {total_rows} rows into groundwater_quality")
    finally:
        conn.close()

# ------------------------
# Usage
# ------------------------
if __name__ == "__main__":
    file_path = os.getenv("FILE_PATH")
    try:
        df = pd.read_excel(file_path, header=5)  # Adjust header row if needed
        logging.info(f"Loaded Excel file with {len(df)} rows and {len(df.columns)} columns")
        batch_insert_groundwater_data(df, connection_string)
    except Exception as e:
        logging.error(f"Pipeline failed: {e}")
        raise
