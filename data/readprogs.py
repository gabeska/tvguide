#!/usr/local/bin/python
import datetime
import pymongo
import xml.etree.ElementTree as xml
from collections import namedtuple
from dateutil import parser
from pymongo import MongoClient

def readXMLguide(filename):
    tree=xml.parse(filename)
    rootElt=tree.getroot()
    channels=rootElt.findall("channel")
    programmes=rootElt.findall("programme")
    categoryset=set()
    
    print 'reading channels'
    channellist=[]
    for c in channels:
        id=c.get('id')
        name=c[0].text
        icon=c.find('icon')
        
        if icon is None:
            iconURL=''
        else:
            iconURL=icon.get('src')

        ch={'name':name,'id':id, 'iconURL':iconURL, 'source':'XMLtv'}
        channellist.append(ch)
        

    channeldict=dict([(c.get('id'),c.get('name')) for c in channellist])
    
    
    print 'reading programmes'
    programmelist=[]
    for p in programmes:
        #xml.dump(p)
        start=parser.parse(p.get('start'))
        stop=parser.parse(p.get('stop'))
        channel=channeldict[p.get('channel')]
        
        title=p.find('title').text
        #print title
        desc=p.find('desc')
        if desc is None:
            desc=''
        else:
            desc=desc.text
            
            
        categories=[category.text for category in p.findall('category')]
        
        category=p.find('category')
        if category is None:
            category='Unknown'
        else:
            category=category.text
        
        categoryset.add(category)
        
        #for cat in categories:
        #    categoryset.add(cat)
        
        prog={'title':title,'start':start,'stop':stop,'channel':channel,'desc':desc,'category':category, 'show':True,'source':'XMLtv'}
        
        programmelist.append(prog)

        categorylist=[]
        categorylist=[{'genre':cat} for cat in categoryset]
    
    return channellist,programmelist,categorylist


#def getByGenre(programmelist,genre):
#    progs = [prog for prog in programmelist if genre in prog.get('categories')]
#    return progs
         
def updateDB():
    client=MongoClient()
    db=client.myguide
    programmes=db.programmes
    channellist,programmelist,categorylist=readXMLguide('newtvguide.xml')
    #print channellist
    #print categorylist


    programmes.remove({"source":"XMLtv"})
    programmes.insert(programmelist)
    db.genres.remove()
    db.genres.insert(categorylist)
    db.channels.remove({"source":"XMLtv"})
    db.channels.insert(channellist)


    #update show field for programmes we don't want to see (based on title)
    programmesToHide=[p['title'] for p in db.hiddenprogrammes.find()]
    programmes.update({"title":{"$in":programmesToHide}},{"$set":{"show":False}},multi=True  )

    #24 Kitchen programmes don't have a category
    programmes.update({"category":"Unknown","channel":"24 Kitchen"},{"$set":{"category":"Educational"}},multi=True)

updateDB()

