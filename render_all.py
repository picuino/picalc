# -*- coding: utf-8 -*-
"""
  Read yaml databases in local directory
  and process all to make html pages
  for online calculations
"""

#import os
import base64
#from jinja2 import Environment, PackageLoader, select_autoescape
#from picalc import Picalc

import os
import re
import codecs
from jinja2 import Environment, FileSystemLoader, select_autoescape, Template
import yaml
import time
import hashlib


# ********************************************************************

class Picalc(object):
   
   def __init__(self, database_name):
      self.templates_path = 'templates'
      self.include_path = 'include'
      self.options_name = 'options.yaml'
      self.load_database(database_name)
      self.load_template()

   
   def load_database(self, filename):
      """Read database from file
         Fill empty values of database with default options"""
      self.database_name = re.sub('^.[\\/]', '', filename)
      self.database = yaml.load(self.read(self.database_name))
      self.format_database()


   def load_template(self):
      """Read template from file"""
      self.env = Environment(
                    loader=FileSystemLoader(self.templates_path),
                    autoescape=select_autoescape(['html', 'xml']))
      self.template = self.env.get_template(self.template_name)
      

   def render(self, binobjects):
      """Render template"""
      self.page = self.template.render(
                     rows=self.database['rows'],
                     data=self.database,
                     version=' {{time_sha_version}} ',
                     binobjects=binobjects)
      self.version = self.compute_version(self.page)
      self.page = Template(self.page).render(time_sha_version=self.version)


   def format_database(self):
      self.database_default_options()
      self.load_includes()
      self.database_fill()

      
   def load_includes(self):
      """Read all include files present in database"""
      if not 'include' in self.database:
         return
      for include in self.database['include']:
         if not 'name' in include:
            continue
         print '   Load:', os.path.join(self.include_path, include['name'])
         include['code'] = self.read(os.path.join(self.include_path, include['name']))


   def option(self, name):
      """Return option from database or local variables
         Return none if key does not exists"""
      if name in self.database:
         return self.database[name]
      if name in self.__dict__:
         return self.__dict__[name]
      return None

         
   def database_default_options(self):
      """Fill empty values of database with default options"""
      default = yaml.load(self.read(\
                os.path.join(self.templates_path, self.options_name)))
      default['output'] = os.path.splitext(self.database_name)[0] + '.html'
      for key in default.keys():
         if not key in self.database:
            self.database[key] = default[key]
      self.templates_path = self.option('templates_path')
      self.template_name = self.option('template')
      self.include_path = self.option('include_path')
      self.output_name = self.option('output')


   def database_fill(self):
      """Fill database empty fields.
         fill id with names
         fill prefix with number according unit prefix"""
      for row in self.database['rows']:
         # Generate id string based on name
         if not 'id' in row:
            row['id'] = re.sub(' ', '_', row['name'])

         # Translate units to exponential number prefix, if not exist.
         if not 'prefix' in row and row['type'] in ['var', 'const', 'calc']:
            translate = {
               'n': 1e-9, 'u': 1e-6, 'm': 1e-3,
               'k': 1e3,  'M': 1e6,  'G': 1e9,
            }
            if 'unit' in row and isinstance(row['unit'], str) \
               and len(row['unit'])>1 and row['unit'][0] in translate:
               row['prefix'] = translate[row['unit'][0]]
            else:
               row['prefix'] = 1

 
   def write(self, filename, data):
      """Write data to disk with utf-8 encoding"""
      fo = codecs.open(filename, 'w', encoding='utf-8')
      fo.write(data)
      fo.close()


   def read(self, filename):
      """Read data from disk with utf-8 encoding"""
      fi = codecs.open(filename, 'r', encoding='utf-8')
      data = fi.read()
      fi.close()
      return data


   def compute_version(self, data):
      """Return version string based on hash of
         database and template"""
      date = time.strftime("%d/%m/%Y")
      sha  = hashlib.sha256(data.encode('utf8')).hexdigest()
      return date + ' - SHA:' + sha.upper()[:6]


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

   pc = Picalc(database)
   print('   Template: ' + pc.template_name)

   pc.render(images)
   print('   Output:   ' + pc.output_name)
   print('   Version:  ' + pc.version)

   pc.write(pc.output_name, pc.page)


def main():
   # Read all images of directory in base64 format
   images = {}

   # Import images in base64 format
   print('Images:')
   for filename in findfiles(['.png', '.gif', '.jpg'], path='images'):
      ext = os.path.splitext(filename)[1].lower()
      images[filename] = 'data:image/%s;base64,\n' % (ext[1:]) + read_base64(filename)
      print('   ' + filename)

   # Process all yaml databases
   for filename in findfiles(['.yaml']):
       process(filename, images)


if __name__ == "__main__":
    main()
