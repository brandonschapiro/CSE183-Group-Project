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
from collections import defaultdict
from datetime import date
from py4web.utils.grid import Grid
import json

url_signer = URLSigner(session)

@action('index')
@action.uses('index.html', db, auth.user, url_signer)
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

    sightings = db(query).select(db.sighting.species_count, db.checklist.latitude, db.checklist.longitude).as_list()
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
def statistics():
    return dict(
        my_callback_url = URL('my_callback', signer=url_signer),
        get_user_statistics_url = URL('get_user_statistics'),
    )

# @action('get_user_statistics', method='GET')
# @action.uses(db, auth, url_signer)
# def get_user_statistics():
#     user_email = "sample0@gmail.com"
#     query = (db.checklist.user_email == user_email)
#     unique_species_data = db(query).select(
#         db.species.id,
#         db.species.name,
#         db.checklist.observation_date,
#         distinct=True,
#         join=[
#             db.sighting.on(db.sighting.checklist_id == db.checklist.id),
#             db.species.on(db.sighting.species_id == db.species.id)
#         ]
#     )
    
#     species_names = []
#     observation_dates = []
#     sightings_count = {}

#     for row in unique_species_data:
#         species_names.append(row.species.name)
#         observation_date = row.checklist.observation_date
#         observation_dates.append(observation_date)
#         # Convert date to string for JSON serialization
#         date_str = observation_date.isoformat()
#         if date_str in sightings_count:
#             sightings_count[date_str] += 1
#         else:
#             sightings_count[date_str] = 1

#     print(sightings_count)
#     return dict(
#         species_names=species_names,
#         observation_dates=observation_dates,
#         sightings_count=sightings_count,
#     )


from collections import defaultdict
@action('get_user_statistics', method='GET')
@action.uses(db, auth, url_signer)
def get_user_statistics():
    user_email = get_user_email
    print(user_email)
    # user_email = "sample0@gmail.com"
    query = (db.checklist.user_email == user_email)
    unique_species_data = db(query).select(
        db.species.id,
        db.species.name,
        db.checklist.observation_date,
        db.checklist.latitude,
        db.checklist.longitude,
        distinct=True,
        join=[
            db.sighting.on(db.sighting.checklist_id == db.checklist.id),
            db.species.on(db.sighting.species_id == db.species.id)
        ]
    )
    
    species_dates = defaultdict(list)
    sightings_count = {}

    for row in unique_species_data:
        species_name = row.species.name
        observation_date = row.checklist.observation_date
        date_str = observation_date.strftime('%Y-%m-%d')  # Convert date to string
        latitude = row.checklist.latitude
        longitude = row.checklist.longitude
        species_dates[species_name].append({
            'date': date_str,
            'latitude': latitude,
            'longitude': longitude
        })
        if date_str in sightings_count:
            sightings_count[date_str] += 1
        else:
            sightings_count[date_str] = 1
    
    species_dates = dict(species_dates)  # Convert defaultdict to a regular dict for JSON serialization
    return dict(
        species_dates=species_dates,
        sightings_count=sightings_count,
    )


@action('location')
@action.uses('location.html', db, auth, url_signer)
def location():
    lat1 = request.query.get('lat1')
    lat2 = request.query.get('lat2')
    lng1 = request.query.get('lng1')
    lng2 = request.query.get('lng2')
    return dict(
        # COMPLETE: return here any signed URLs you need.
        my_callback_url = URL('my_callback', signer=url_signer),
        get_region_information_url = URL('get_region_information'),
        lat1 = lat1,
        lat2= lat2,
        lng1 = lng1,
        lng2 = lng2
    )


#Gets species information for location page, somewhat slow, takes 14 seconds for loading roughly 2k checklists and 30k sightings right now
@action('get_region_information', method='GET')
@action.uses(db, auth.user)
def get_region_information():
    #queries checklist table by latitude and longitude coordinates provided from index page
    lat1 = request.query.get('lat1')
    lat2 = request.query.get('lat2')
    lng1 = request.query.get('lng1')
    lng2 = request.query.get('lng2')
    print(lat1, lat2, lng1, lng2)
    checklists = []
    if(lat1 and lat2 and lng1 and lng2):
        minLat = min(lat1, lat2)
        maxLat = max(lat1, lat2)
        minLng = min(lng1, lng2)
        maxLng = min(lng1, lng2)
        checklists = db(db.checklist.latitude.cast('float') >= minLat and db.checklist.latitude.cast('float') <= maxLat and db.checklist.longitude.cast('float') >= minLng and db.checklist.longitude.cast('float') <= maxLng).select()
    if(not checklists):
        checklists = db(db.checklist).select(orderby=db.checklist.id, limitby=(0, 100))

    checklists_with_sightings = []
    sightings_list = []
    unique_sighting_ids = set()
    unique_sightings = []
    sightings_dict = defaultdict(list)
    #each list in top_contributors has 4 values that are kept track of, defined below
    #0 - checklist count, 1 - sightings count, 2 total species sighted, 3 unique species sighted
    top_contributors = defaultdict(list)
    contributor_species = defaultdict(set)
    all_sightings = db(db.sighting).select(left=db.species.on(db.sighting.species_id == db.species.id))
    for sight in all_sightings:
        sightings_dict[sight.sighting.checklist_id].append(sight)
    #Going through checklists and gathering required information
    for checklist in checklists:
        sightings = sightings_dict[checklist.id]
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
        if not top_contributors[checklist.user_email]:
            top_contributors[checklist.user_email] = [1, 0, 0, 0]
        else:
            top_contributors[checklist.user_email][0] += 1
        for sighting in sightings:
            sighting_data = {
                "sighting_id":sighting.sighting.id,
                "species_id":sighting.species.id,
                "species_name":sighting.species.name,
                "species_count":sighting.sighting.species_count,
                "date":checklist.observation_date,
            }
            #Update top contributor information
            top_contributors[checklist.user_email][1] += 1
            top_contributors[checklist.user_email][2] += sighting.sighting.species_count
            contributor_species[checklist.user_email].add(sighting.species.name)
            top_contributors[checklist.user_email][3] = len(contributor_species[checklist.user_email])
            
    #Lots of stuff here but basically just processing data to be sent to frontend, not sure if done in the most efficient way but it works at least        
            sightings_list.append(sighting_data)
            if(sighting.species.id not in unique_sighting_ids):
                unique_sighting_ids.add(sighting.species.id)
                unique_sightings.append({'id':sighting.species.id,'name':sighting.species.name})
            checklist_data['sightings'].append(sighting_data)
        checklists_with_sightings.append(checklist_data)
    unique_sightings_sorted = sorted(unique_sightings, key=lambda x: x['id'])
    sorted_top_contributors = dict(sorted(top_contributors.items(), key=lambda x:[1][0], reverse=True))
    top_contribs = []
    for key in sorted_top_contributors:
        top_contribs.append([key] + sorted_top_contributors.get(key))
    top_contribs = sorted(top_contribs, key=lambda x:x[1], reverse=True)
    if(len(top_contribs) > 10):
        top_contribs = top_contribs[0:9]
    #top_contribs = json.dumps([[key] + value for key, value in top_contributors.items()])
    #top_contribs = sorted(top_contribs, key=lambda x:[1], reverse=True)
    return dict(checklists = checklists_with_sightings, sightings = sightings_list, unique_sightings = unique_sightings_sorted, top_contributors = top_contribs)
    

@action('my_callback')
@action.uses() # Add here things like db, auth, etc.
def my_callback():
    # The return value should be a dictionary that will be sent as JSON.
    return dict(my_value=3)

# @action('get_checklists', method=['GET'])
# @action.uses(db, auth.user)
# def get_checklists():
#     user_email = auth.current_user.get('email')
#     checklists = db(db.checklist.user_email == user_email).select(
#         db.checklist.ALL, db.species.name,
#         join=db.species.on(db.checklist.species_id == db.species.id)
#     ).as_list()
#     return dict(checklists=checklists)

# @action('save_checklist', method=['POST'])
# @action.uses(db, auth.user)
# def save_checklist():
#     data = request.json
#     user_email = auth.current_user.get('email')
#     if data.get('id'):
#         db(db.checklist.id == data.get('id')).update(
#             user_email=user_email,
#             species_id=data.get('species_id'),
#             count=data.get('count')
#         )
#     else:
#         db.checklist.insert(
#             user_email=user_email,
#             species_id=data.get('species_id'),
#             count=data.get('count')
#         )
#     db.commit()
#     return "success"

# @action('delete_checklist', method=['POST'])
# @action.uses(db, auth.user)
# def delete_checklist():
#     data = request.json
#     db(db.checklist.id == data.get('id')).delete()
#     db.commit()
#     return "success"