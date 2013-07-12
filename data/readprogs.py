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
        ch={'name':name,'id':id}
        channellist.append(ch)
        #hier dict van maken en nummers in proglijst door channel vervangen?
        #print name
        
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
        
        
        for cat in categories:
            categoryset.add(cat)
        
        prog={'title':title,'start':start,'stop':stop,'channel':channel,'desc':desc,'category':category,'categories':categories}
        
        programmelist.append(prog)
        
    
    return channellist,programmelist,categoryset

def getByGenre(programmelist,genre):
    progs = [prog for prog in programmelist if genre in prog.get('categories')]
    return progs
         
def updateDB():
	client=MongoClient()
	db=client.myguide
	programmes=db.programmes2
	channellist,programmelist,categoryset=readXMLguide('tvguide.xml')
	programmes.insert(programmelist)
	db.genres2.insert(categoryset)
	db.channels2.insert(channellist)

updateDB()

