"""
This file defines the database models
"""

import datetime
from .common import db, Field, auth
from pydal.validators import *
import csv


def get_user_email():
    return auth.current_user.get('email') if auth.current_user else None

def get_time():
    return datetime.datetime.utcnow()


### Define your table below
#
# db.define_table('thing', Field('name'))
#
## always commit your models to avoid problems later

db.define_table('species', 
                Field('name', 'string'))

db.define_table('checklist',
                Field('user_email', default=get_user_email),
                Field('latitude', 'string'),
                Field('longitude', 'string'),
                Field('observation_date', 'date'),
                Field('observation_time', 'time'),
                Field('observation_duration', 'integer'))

db.define_table('sighting',
                Field('checklist_id', 'reference checklist'),
                Field('species_id', 'reference species'),
                Field('species_count', 'integer'))


#Initializes database tables with sample data, as well as links sample data by database table id instead of using the sampling event identifier provided in the csv files.
#Will need to set your own path to run properly, initializing the database took around 5 minutes on my machine, not optimized very well but should only need to run once
if db(db.species).isempty():
    with open('/mnt/c/Programming/CSE 183/Final Project/starter_vue3/apps/bird_watching/sample_data/species.csv', 'r') as f:
        reader = csv.reader(f)
        for row in reader:
            db.species.insert(name=row[0])

if db(db.checklist).isempty():
    sights = []
    with open('/mnt/c/Programming/CSE 183/Final Project/starter_vue3/apps/bird_watching/sample_data/sightings.csv', 'r') as sight:
                sightings = csv.reader(sight)
                next(sightings, None)
                for row in sightings:
                    sights.append(row)

    checklists = []
    with open('/mnt/c/Programming/CSE 183/Final Project/starter_vue3/apps/bird_watching/sample_data/checklists.csv', 'r') as check:
        checks = csv.reader(check)
        next(checks, None)
        for row in checks:
             checklists.append(row)
    for j in range(len(checklists)):
        email = "sample" + str((j%10)) + "@gmail.com"
        current_checklist = db.checklist.insert(user_email=email, latitude=checklists[j][1], longitude=checklists[j][2], observation_date=checklists[j][3], observation_time=checklists[j][4], observation_duration=(int(float(checklists[j][6])) if checklists[j][6] else 0))
        #Gets all sightings for the checklist being added and adds them to the database
        for i in range(len(sights)):
            if(sights[i][0] == checklists[j][0]):
                species = db(db.species.name == sights[i][1]).select().first()
                if(species == None):
                    species = db.species.insert(name=sights[i][1])
                db.sighting.insert(checklist_id=current_checklist.id, species_id=species.id, species_count=(80 if sights[i][2] == 'X' else int(sights[i][2])))


db.commit()
