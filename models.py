"""
This file defines the database models
"""

import datetime
from .common import db, Field, auth
import csv
from pydal.validators import *


def get_user_email():
    return auth.current_user.get('email') if auth.current_user else None

def get_time():
    return datetime.datetime.utcnow()


### Define your table below
#
# db.define_table('thing', Field('name'))
#
## always commit your models to avoid problems later

# Species table
db.define_table('species',
    Field('species_id', 'string', unique=True, requires=IS_NOT_EMPTY()),
    Field('name', 'string', requires=IS_NOT_EMPTY())
)

# Checklists table
db.define_table('checklists',
    Field('sampling_event_identifier', 'string', unique=True, requires=IS_NOT_EMPTY()),
    Field('user_id', 'reference auth_user', requires=IS_NOT_EMPTY()),
    Field('location', 'string', requires=IS_NOT_EMPTY()),
    Field('date', 'date', default=get_time),
    Field('latitude', 'double'),
    Field('longitude', 'double')
)

# Sightings table
db.define_table('sightings',
    Field('sighting_id', 'string', unique=True, requires=IS_NOT_EMPTY()),
    Field('checklist_id', 'reference checklists', requires=IS_NOT_EMPTY()),
    Field('species_id', 'reference species', requires=IS_NOT_EMPTY()),
    Field('count', 'integer', requires=IS_INT_IN_RANGE(0, None)),
    Field('latitude', 'double'),
    Field('longitude', 'double')
)

# # Load species data
# if db(db.species).isempty():
#     with open('/mnt/data/species.csv', 'r') as f:
#         reader = csv.reader(f)
#         for row in reader:
#             db.species.insert(species_id=row[0], name=row[1])

# # Load checklists data
# if db(db.checklists).isempty():
#     with open('/mnt/data/checklists.csv', 'r') as f:
#         reader = csv.reader(f)
#         for row in reader:
#             db.checklists.insert(
#                 sampling_event_identifier=row[0],
#                 user_id=row[1],
#                 location=row[2],
#                 date=row[3],
#                 latitude=row[4],
#                 longitude=row[5]
#             )

# # Load sightings data
# if db(db.sightings).isempty():
#     with open('/mnt/data/sightings.csv', 'r') as f:
#         reader = csv.reader(f)
#         for row in reader:
#             db.sightings.insert(
#                 sighting_id=row[0],
#                 checklist_id=row[1],
#                 species_id=row[2],
#                 count=row[3],
#                 latitude=row[4],
#                 longitude=row[5]
#             )

db.commit()
