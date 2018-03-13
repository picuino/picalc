# -*- coding: utf-8 -*-
"""
  Read yaml databases in local directory
  and process all to make html pages
  for online calculations
"""

import os
import codecs
import re
from jinja2 import Template
import yaml
import time
import hashlib
import base64

# ********************************************************************

class picalc:
   
   def __init__(self):
      self.database = {}
      self.template = None
      self.template_code = None
      self.page = None


   def template_name(self):
      return self.database['template']

   
   def output_name(self):
      return self.database['output']

   
   def default_options(self):
      """Fill empty values of database with default options"""
      # Default general options
      default = {
         'resolution': 5,
         'template': 'template.html.jinja2',
         'font': {
            'normal_size': '16px',
            'license_size': '12px',
         },
         'width': {
            'max': '640px',
            'min': '420px',
            'name': '6em',
            'value': '6em',
            'units': '6em',
            'comment': '20em',
         },
         'output': os.path.splitext(self.database_name)[0] + '.html',
      }

      for key in default.keys():
         if not key in self.database:
            self.database[key] = default[key]

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


   def version(self):
      """Return version string based on hash of
         database and template"""
      date = time.strftime("%d/%m/%Y")
      sha  = hashlib.sha256(\
             unicode(self.database).encode('utf8') +
             unicode(self.template_code).encode('utf8') \
             ).hexdigest()
      return date + ' - SHA:' + sha.upper()[:6]


   def load(self, filename):
      """Read database from file
         Fill empty values of database with default options
         Load template"""
      self.database_name = re.sub('^.[\\/]', '', filename)
      self.database = yaml.load(self.read(filename))
      self.default_options()
      self.load_include()


   def load_include(self):
      """Read code of all included files"""
      if not 'include' in self.database:
         return
      for inc in self.database['include']:
         inc['code'] = self.read(os.path.join('include', inc['name']))


   def load_template(self):
      """Read template from file"""
      self.template_code = self.read(self.database['template'])
      self.template = Template(self.template_code)
      

   def render(self, binobjects):
      """Render template"""
      self.page = self.template.render(
                     rows=self.database['rows'],
                     data=self.database,
                     version=self.version(),
                     binobjects=binobjects)


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
   
   pc = picalc()
   pc.load(database)
   pc.load_template()
   pc.render(images)
   pc.write(pc.output_name(), pc.page)
   
   print('   Template: ' + pc.template_name())
   print('   Output:   ' + pc.output_name())
   print('   Version:  ' + pc.version())


def main():
   # Read all images of directory in base64 format
   images = {}
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
