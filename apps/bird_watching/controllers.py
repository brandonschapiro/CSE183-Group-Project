"""
This file defines actions, i.e. functions the URLs are mapped into
The @action(path) decorator exposed the function at URL:

    http://127.0.0.1:8000/{app_name}/{path}

If app_name == '_default' then simply

    http://127.0.0.1:8000/{path}

If path == 'index' it can be omitted:

    http://127.0.0.1:8000/

The path follows the bottlepy syntax.

@action.uses('generic.html')  indicates that the action uses the generic.html template
@action.uses(session)         indicates that the action uses the session
@action.uses(db)              indicates that the action uses the db
@action.uses(T)               indicates that the action uses the i18n & pluralization
@action.uses(auth.user)       indicates that the action requires a logged in user
@action.uses(auth)            indicates that the action requires the auth object

session, db, T, auth, and tempates are examples of Fixtures.
Warning: Fixtures MUST be declared with @action.uses({fixtures}) else your app will result in undefined behavior
"""

from py4web import action, request, abort, redirect, URL
from yatl.helpers import A
from .common import db, session, T, cache, auth, logger, authenticated, unauthenticated, flash
from py4web.utils.url_signer import URLSigner
from .models import get_user_email

url_signer = URLSigner(session)

@action('index')
@action.uses('index.html', db, auth, url_signer)
def index():    
    return dict(
        my_callback_url=URL('my_callback', signer=url_signer),
        get_species_url=URL('get_species', signer=url_signer),
        get_sightings_url=URL('get_sightings', signer=url_signer)
    )

@action('get_species', method=['GET'])
@action.uses(db, auth)
def get_species(path=None):
    print("hi from get_species")
    species = db(db.species).select().as_list()
    return dict(species=species)

@action('get_sightings', method=['GET'])
@action.uses(db)
def get_sightings():
    
    species_id = request.params.get('species_id')
    if species_id:
        query = (db.sighting.species_id == species_id) & (db.sighting.checklist_id == db.checklist.id)
    else:
        query = db.sighting.checklist_id == db.checklist.id
    sightings = db(query).select(db.sighting.ALL, db.checklist.latitude, db.checklist.longitude).as_list()
    return dict(sightings=sightings)

@action('checklist')
@action.uses('checklist.html', db, auth, url_signer)
def index():
    return dict(
        # COMPLETE: return here any signed URLs you need.
        my_callback_url = URL('my_callback', signer=url_signer),
    )

@action('statistics')
@action.uses('statistics.html', db, auth, url_signer)
def index():
    return dict(
        # COMPLETE: return here any signed URLs you need.
        my_callback_url = URL('my_callback', signer=url_signer),
    )

@action('location')
@action.uses('location.html', db, auth, url_signer)
def index():
    return dict(
        # COMPLETE: return here any signed URLs you need.
        my_callback_url = URL('my_callback', signer=url_signer),
        get_region_information_url = URL('get_region_information')
    )


#Gets species information for location page, not fully implemented yet, will still need to add latitude and longitude coordinates to search query
#but for now will populate just based on sample data. Returns list of unique species, as well as a list of checklists, each one containing a list of sightings
@action('get_region_information', method='GET')
@action.uses(db, auth.user)
def get_region_information():

    checklists = db(db.checklist).select(orderby=db.checklist.id, limitby=(0, 100))

    checklists_with_sightings = []
    sightings_list = []
    unique_sighting_ids = set()
    unique_sightings = []
    for checklist in checklists:
        sightings = db(db.sighting.checklist_id == checklist.id).select(left=db.species.on(db.sighting.species_id == db.species.id))
        checklist_data = {
            "id":checklist.id,
            "user_email":checklist.user_email,
            "latitude":checklist.latitude,
            "longitude":checklist.longitude,
            "observation_date":checklist.observation_date,
            "observation_time":checklist.observation_time,
            "observation_duration":checklist.observation_duration,
            "sightings": []
        }
        for sighting in sightings:
            sighting_data = {
                "sighting_id":sighting.sighting.id,
                "species_id":sighting.species.id,
                "species_name":sighting.species.name,
                "species_count":sighting.sighting.species_count,
            }
            sightings_list.append(sighting_data)
            if(sighting.species.id not in unique_sighting_ids):
                unique_sighting_ids.add(sighting.species.id)
                unique_sightings.append({'id':sighting.species.id,'name':sighting.species.name})
            checklist_data['sightings'].append(sighting_data)
        checklists_with_sightings.append(checklist_data)
    unique_sightings_sorted = sorted(unique_sightings, key=lambda x: x['id'])
    return dict(checklists = checklists_with_sightings, sightings = sightings_list, unique_sightings = unique_sightings_sorted)
    

@action('my_callback')
@action.uses() # Add here things like db, auth, etc.
def my_callback():
    # The return value should be a dictionary that will be sent as JSON.
    return dict(my_value=3)
