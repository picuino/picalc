# -*- coding: utf-8 -*-
"""
  Read yaml database and process data
  with jinja templates to make html pages
  for online calculations
"""

import os
import codecs
import re
from jinja2 import Environment, PackageLoader, select_autoescape
import yaml
import time
import hashlib


# ********************************************************************

class picalc:
   
   def __init__(self, path='templates'):
      self.database = {}
      self.template = None
      self.template_code = None
      self.page = None
      self.path = path
      self.env = Environment(
         loader=PackageLoader('', 'templates'),
         autoescape=select_autoescape(['html', 'xml'])
      )

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
      print self.env.TemplateModule

      
      asdfasdf
      sha  = hashlib.sha256(\
             unicode(self.database).encode('utf8') +
             unicode(self.TemplateModule).encode('utf8') \
             ).hexdigest()
      return date + ' - SHA:' + sha.upper()[:6]


   def load_database(self, filename):
      """Read database from file
         Fill empty values of database with default options"""
      self.database_name = re.sub('^.[\\/]', '', filename)
      self.database = yaml.load(self.read(filename))
      self.default_options()


   def load_template(self):
      """Read template from file"""
      self.template = env.get_template(self.template_name)
      

   def render(self, binobjects):
      """Render template"""
      self.page = self.template.render(
                     rows=self.database['rows'],
                     data=self.database,
                     version=self.version(),
                     binobjects=binobjects)

