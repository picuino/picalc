# -*- coding: utf-8 -*-
"""
  Read yaml databases in local directory
  and process all to make html pages
  for online calculations
"""

import os
import types
import base64
from jinja2 import Environment, PackageLoader, select_autoescape
from jinja2.utils import internalcode
import picalc

# ********************************************************************

def read_base64(filename):
   fi = open(filename, 'rb')
   data = fi.read()
   fi.close()
   return data.encode('base64')


def findfiles(extensions, path='.'):
   """Return all files of path with matching extensions"""
   for filename in os.listdir(path):
      ext = os.path.splitext(filename)[1].lower()
      if isinstance(extensions, list) and ext in extensions:
         yield os.path.join(path, filename).replace('\\', '/')
      if isinstance(extensions, str) and ext == extensions:
         yield os.path.join(path, filename).replace('\\', '/')


def process(database, images):
   """Process and render database"""
   print('\nDatabase: ' + database)
   
   pc = picalc('templates')
   pc.load_database(database)
   pc.load_template()
   pc.render(images)
   pc.write(pc.output_name(), pc.page)
   
   print('   Template: ' + pc.template_name())
   print('   Output:   ' + pc.output_name())
   print('   Version:  ' + pc.version())


def main():

   env = Environment(
         loader=PackageLoader('picalc', '.'),
         autoescape=select_autoescape(['html', 'xml'])
   )
 
   template = env.get_template('base.html')
   stream =  template.stream()

   if 0:
      i = 0
      for name in dir(stream):
         ob = template.__dict__.get(name)
         i = i + 1;
         print "      print '%02d' + str(stream." % i + str(name) + '() )'
      print '******************************'
   if 0:
      print '1', template.__reduce__()
      print '2', template.__repr__()
      print '3', template.__str__()
      print '4', template.filename
      print '6', template.name
   
   if 1:
      print '12' + str(stream.__reduce__() )
      print '13' + str(stream.__reduce_ex__() )
      print '14' + str(stream.__repr__() )
      print '15' + str(stream.__setattr__() )
      print '16' + str(stream.__sizeof__() )
      print '17' + str(stream.__str__() )
      print '18' + str(stream.__subclasshook__() )
      print '19' + str(stream.__weakref__() )
      print '20' + str(stream._buffered_generator() )
      print '21' + str(stream._gen() )
      print '22' + str(stream._next() )
      print '23' + str(stream.buffered() )
      print '24' + str(stream.disable_buffering() )
      print '25' + str(stream.dump() )
      print '26' + str(stream.enable_buffering() )
      print '27' + str(stream.next() )
   
   asdfaf
   # Read all images of directory in base64 format
   images = {}
   print('Images:')
   for filename in findfiles(['.png', '.gif', '.jpg'], path='images'):
      ext = os.path.splitext(filename)[1].lower()
      images[filename] = 'data:image/%s;base64,\n' % (ext[1:]) + read_base64(filename)
      print('   ' + filename)

   # Process all yaml databases
   for filename in findfiles(['.yaml'], 'templates'):
       process(filename, images)


if __name__ == "__main__":
    main()
