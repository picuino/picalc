# -*- coding: utf-8 -*-
"""
Picalc is a Python and Jinja2 program for make online and
offline calculators based on standalone html and javascript.
A yaml database stores all information about the content
and style options of the calculator.

For more extensive information see example.yaml

Picalc
======
This work by Picuino(https://github.com/picuino/picalc)
is licensed under a GPL version 3 license
(http://www.gnu.org/licenses/gpl-3.0-standalone.html)

"""

import base64
import os
import re
import codecs
from jinja2 import Environment, FileSystemLoader, Template #, select_autoescape
import yaml
import time
import hashlib


__license__ = """
This work by Picuino (https://github.com/picuino/picalc)
is licensed under a GPL version 3 license (http://www.gnu.org/licenses/gpl-3.0.txt)
"""

# ********************************************************************

CONFIG_NAME = 'config.yaml'

class Container(dict):
   """Object for contain dicts"""
   def __init__(self, data):
      self.update(data)
      
   def update(self, data):
      self.__dict__.update(data)

   def __str__(self):
      return str(self.__dict__)

   
class Picalc(object):
   
   def __init__(self, database_name):
      self.database_name = database_name
      self.config_name = CONFIG_NAME
      self.load()


   def load(self):
      self.load_config()    # Load default config.yaml
      self.load_database()  # Load database.yaml
      self.load_template()  # Load template.html


   def load_config(self):
      """Read default options"""
      config = yaml.load(self.read(self.config_name))['config']
      self.config = Container(config)


   def load_database(self):
      """Read database from file
         Fill empty values of database with default options"""
      # Read external database
      self.database_name = re.sub('^.[\\/]', '', self.database_name)
      database = yaml.load(self.read(self.database_name))

      # Copy data to internal variables
      self.config.update(database['config'])
      if not 'include' in database:
         database['include'] = []
      self.include = database['include']
      self.rows = database['rows']

      # Format database    
      self.load_images()
      self.database_complete()


   def load_template(self):
      """Read template from file"""
      self.env = Environment(
         loader=FileSystemLoader(
            self.config.template_path, encoding='utf-8-sig'),
         autoescape=False)
      self.template = self.env.get_template(self.config.template_name)
      

   def load_images(self):
      """Read all include files present in database"""
      # Load image files
      self.images = {}
      for row in self.rows:
         if row['type'] == 'image':
            ext = os.path.splitext(row['name'])[1][1:]
            row['code'] = 'data:image/%s;base64,\n' % ext + \
                          self.read_base64(os.path.join( \
                          self.config.images_path, row['name']))


   def read_base64(self, filename):
      fi = open(filename, 'rb')
      data = fi.read()
      fi.close()
      return data.encode('base64')


   def render(self):
      """Render template"""
      self.page = self.template.render(
                     config=self.config,
                     include=self.include,
                     rows=self.rows,
                     version='{{time_sha_version}}')
      self.version = self.compute_version(self.page)
      self.output = Template(self.page).render(time_sha_version=self.version)
      return self.output

      
   def database_complete(self):
      """Fill empty fields in database
         fill empty id with names
         fill empty prefix with number according with unit prefix"""
      for row in self.rows:
         # Generate id string based on name
         if not 'id' in row and not row['type'] in ['buttons']:
            row['id'] = re.sub(' ', '_', row['name'])

         # Translate units to exponential number prefix, if not exist.
         if not 'prefix' in row and row['type'] in ['var', 'const', 'calc']:
            translate = {
               'p': 1e-12, 'n': 1e-9,
               'u': 1e-6, 'm': 1e-3,
               'k': 1e3,  'M': 1e6,
               'G': 1e9, 'T': 1e12,         
            }
            if 'unit' in row and isinstance(row['unit'], str) \
               and len(row['unit'])>1 and row['unit'][0] in translate:
               row['prefix'] = translate[row['unit'][0]]
            else:
               row['prefix'] = 1

 
   def write(self, filename, data):
      """Write data to disk with utf-8 encoding"""
      fo = codecs.open(filename, 'w', encoding='utf-8-sig')
      fo.write(data)
      fo.close()


   def read(self, filename):
      """Read data from disk with utf-8 encoding"""
      fi = codecs.open(filename, 'r', encoding='utf-8-sig')
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


def findfiles(extensions, path='.'):
   """Return all files of path with matching extensions"""
   if not isinstance(extensions, list):
      extensions = [extensions]

   for filename in os.listdir(path):
      ext = os.path.splitext(filename)[1].lower()
      if not ext in extensions:
         continue
      if path == '.':
         yield filename.replace('\\', '/')
      else:
         yield os.path.join(path, filename).replace('\\', '/')


def process(database):
   """Process and render database"""
   pc = Picalc(database)
   if pc.config_name == database:
      return
   print('\nDatabase: ' + database)
   print('   Template: ' + pc.config.template_name)

   output = pc.render()
   output_name = os.path.splitext(database)[0] + '.html'
   print('   Output:   ' + output_name)
   print('   Version:  ' + pc.version)
   pc.write(output_name, output)


def main():
   # Process all yaml databases
   for filename in findfiles(['.yaml']):
      if (filename == CONFIG_NAME):
         continue
      process(filename)


if __name__ == "__main__":
    main()
