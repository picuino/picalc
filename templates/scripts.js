{%- macro to_numexp_5(num) -%} {{"%5.4e"|format(num|float)}} {%- endmacro %}
{%- macro macro_prefix(prefix) -%}
   {%- if prefix == 1 %} 1.0
   {%- else %} {{"%1.0e"|format(prefix|float)}}
   {%- endif %}
{%- endmacro %}

{#- ********** Global variables ********** #}

   {#- Define global variables #}

   // Global variables and backup
   {%- for rowdata in rows -%} {%- if rowdata.type in ['var', 'const', 'calc'] %}
   var {{rowdata.id}};  // {{rowdata.comment}}
   {%- endif %} {%- endfor %}
   var variables_backup = {}; // Global variables values backup

   {#- Global variables properties #}

   // Global variables properties
   var _prefix = {
     {%- for rowdata in rows -%} {%- if rowdata.type in ['var', 'const', 'calc'] %}
     "{{rowdata.id}}": {{ macro_prefix(rowdata.prefix) }},
     {%- endif %} {%- endfor %}
   };


{#- ********** Include external files ********** #}

{%- for inc in include %} {% if inc.type == 'script' %}


   /*********************************************************************/
   /* Include script: {{inc.name}}{{' '*(49 - inc.name|length)}} */
   /*                                                                   */
   {%- macro include_script(name) %}{% include name %}{% endmacro %}

   {{ include_script(inc.name)|indent(3) }}

   /*                                                                   */
   /* End Include: {{inc.name}}{{' '*(52 - inc.name|length)}} */
   /*********************************************************************/

{%- endif %}{%- endfor %}


{#- ********** Calculate formulas ********** #}

   // Calculate formulas and print values
   function calc() {
      var_backup();
      query_write();

      {%- for rowdata in rows -%} {%- if rowdata.type == 'const' %}

      // Constant: {{rowdata.comment}}
      {{rowdata.id}} = ( {{rowdata.value}} ) * {{ macro_prefix(rowdata.prefix) }};
      {%- endif %} {%- endfor %}

      {%- for rowdata in rows -%} {%- if rowdata.type == 'calc' %}

      // Calculation: {{rowdata.comment}}
         {%- if rowdata.calc is iterable and rowdata.calc is not string %}
         {%- for calc in rowdata.calc %}
      {{calc}};
         {%- endfor %}

         {%- else %}
      {{rowdata.calc}};
         {%- endif %}

      {%- endif %} {%- endfor %}

      // Print variables and calcs
      print_calc();
   }

   // Print calcs
   function print_calc() {

      {#- Write calculate values to html #}
      {%- for rowdata in rows -%} {%- if rowdata.type in ['calc'] %}
      document.getElementById("{{rowdata.id}}").value = num_float({{rowdata.id}} * {{ macro_prefix(1.0/(rowdata.prefix|float)) }}, {{config.resolution}});
      {%- endif %} {%- endfor %}

      {#- Write constants to html #}
      {%- for rowdata in rows -%} {%- if rowdata.type in ['const'] %}
      document.getElementById("{{rowdata.id}}").value = "{{rowdata.value}}";
      {%- endif %} {%- endfor %}
   }


{#- ********** Manage variables ********** #}

   // Read variables from html
   function var_read_id() {

      {%- for rowdata in rows %} {%- if rowdata.type in ['var'] %}
      {{rowdata.id}} = idtonum("{{rowdata.id}}") * {{ macro_prefix(rowdata.prefix) }}; // Variable: {{rowdata.comment}}
      {%- endif %} {%- endfor %}
   }

   // Write variables
   function var_write(config) {
      var name;
      for(var i=0; i<config.length; i++) {
         name = config[i][0];
         if (name in _prefix) {
            window[name] = config[i][1];
         }
      }
      var_write_id();
   }

   // Reset variables to default values
   function var_reset() {

      {%- for rowdata in rows %} {%- if rowdata.type in ['var'] %}
      {{rowdata.id}} = {%- if rowdata.value or rowdata.value == 0 %} ( {{rowdata.value}} ) * {{ macro_prefix(rowdata.prefix) }} {%- else %} ''{% endif %};
      {%- endif %} {%- endfor %}
      var_write_id();
   }

   // Clear variables in html
   function var_clear() {

      {%- for rowdata in rows %} {%- if rowdata.type in ['var'] %}
      {{rowdata.id}} = '';
      {%- endif %} {%- endfor %}
      var_write_id();
   }

   // Test if there are any change in variables
   function var_test_change() {
      {%- for rowdata in rows %} {%- if rowdata.type in ['var'] %}
      if (variables_backup["{{rowdata.id}}"] != {{rowdata.id}}) return true;
      {%- endif %} {%- endfor %}
      return false;
   }

   // Copy values of variables
   function var_backup() {
      {%- for rowdata in rows %} {%- if rowdata.type in ['var'] %}
      variables_backup["{{rowdata.id}}"] = {{rowdata.id}};
      {%- endif %} {%- endfor %}
   }

   // Write variables values to html forms
   function var_write_id() {
      var value;
      {%- for rowdata in rows %} {%- if rowdata.type in ['var'] %}
      if ({{rowdata.id}} == "") value = ""; else value = num_float({{rowdata.id}} / _prefix["{{rowdata.id}}"], {{config.resolution}});
      document.getElementById("{{rowdata.id}}").value = value;
      {%- endif %} {%- endfor %}
   }


{#- ********** Manage Select forms ********** #}

   {%- for rowdata in rows %} {%- if rowdata.type in ['select'] %}

   // Select: {{rowdata.name}}
   function select_{{rowdata.id}}() {
      var database = {
         {%- for select_data in rowdata.select %}
         "{{select_data.name}}": {
            {%- for name in select_data.vars %}"{{name}}": {{select_data.vars[name]}}, {% endfor -%} },
         {%- endfor %}
      }
      // Read selected values
      selected_id = document.getElementById("select_{{rowdata.id}}_id").value;
      data_selected = database[selected_id];
      if (!data_selected || data_selected.length == 0)
         return;
      // Copy values to variables
      for(var key in data_selected) {
         if (key in window)
            window[key] = data_selected[key];
      }
      var_write_id();
      calc();
   }
   {%- endif %} {%- endfor %}


{#- ********** Manage Buttons ********** #}

   // Reset variables to default values in html and JavaScript
   function button_reset() {
      var_reset();
      var_write_id();
      calc();
   }

   // Clear variables in html and JavaScript
   function button_clear() {
      var_clear();
      var_write_id();
      calc();
   }

   // Copy to clipboard the url + query string
   function button_url_copy() {
      query_copy();
   }


{#- ********** Manage query strings ********** #}

   // Write query string into url
   function query_write() {
      var url = document.location.href.split('?')[0];
      var query = '?';
      var value;
      {%- for rowdata in rows %} {%- if rowdata.type in ['var'] %}
      value = encodeURIComponent(num_float({{rowdata.id}}, {{config.resolution}}))
      if (value.length) query = query + "{{rowdata.id}}=" + value + '&';
      {%- endif %} {%- endfor %}
      if (query.length > 1) url = url + query
      history.pushState({id: 'picalc'}, '{{config.title}}', url);
   }

   // Read query string from URL
   function query_read() {
      var url = document.location.href.split('?');
      if (url.length < 2)
         return [];
      var values = url[1].split('&');
      var vars = [];
      for(i=0; i<values.length; i++) {
         var value = values[i].split('=');
         if (value.length != 2) continue;
         vars.push(value);
      }
      return vars;
   }

   // Copy url with query to clipboard
   function query_copy() {
      {#- Info: https://stackoverflow.com/questions/400212/how-do-i-copy-to-the-clipboard-in-javascript #}
      var textArea = document.createElement('textarea');
      textArea.value = document.location.href;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
         document.execCommand('copy');
      } catch (err) {
         console.error('Oops, unable to copy url', err);
      }
      document.body.removeChild(textArea);
   }


{#- ********** Manage numbers ********** #}

   // Evalue inputs with '.' or ',' as comma
   function idtonum(id) {
      val = document.getElementById(id).value.replace(',', '.');
      if (isNaN(val)) return '';
      return val * 1e0; // return number
   }

   // Format number with fixed digits
   function num_float(number, digits) {
      if (!isFinite(number)) return '';
      if (number == 0) return '0';
      if (Math.sign(number) < 0)
         var sign = '-';
      else
         var sign = '';
      number = Math.abs(number)
      // Fixed point number
      if (number >= 1e-3 && number < 1e5) {
         number = Number(number.toPrecision(digits));
         number = sign + number.toString();
         return number;
      }
      // Float number
      else {
         exp = Math.floor(Math.log10(number) / 3) * 3;
         number = number * Math.pow(10, -exp);
         number = Number(number.toPrecision(digits));
         number = number.toString() + 'e' + exp.toString();
         return number;
      }
   }


{#- ********** Manage events ********** #}

   // Setup variables on page load
   function setup() {
      var config = query_read();
      if (config.length > 0) {
         var_write(config);
      }
      else {
         var_reset();
      }
      calc();
   }

   // Manage browser history
   window.onpopstate = function OnPopState(event) {
      setup();
   };

   // Manage keys [Enter] and [tab]
   document.onkeypress = function OnKeyPress(evt) {
      var evt = (evt) ? evt : ((event) ? event : null);
      var node = (evt.target) ? evt.target : ((evt.srcElement) ? evt.srcElement : null);
      if (node.type=="text") {
         if (evt.keyCode == 9) { recalc(); return; }
         if (evt.keyCode == 13) { recalc(); return false; }
      }
   }

   // Recalc values after key pressed
   function recalc() {
      var_read_id();
      if (var_test_change() == true) {
         calc();
      }
   }
