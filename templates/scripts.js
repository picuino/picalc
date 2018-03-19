{%- macro to_numexp_1(num) -%} {{"%1.0e"|format(num|float)}} {%- endmacro %}
{%- macro to_numexp_5(num) -%} {{"%5.4e"|format(num|float)}} {%- endmacro %}

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


{#- ********** Calculate formulaes ********** #}

   // Setup variables onload
   function setup() {
      var config = query_read();
      if (config.length > 0) {
         var_write(config);
         var_backup();
      }
      else var_reset();
      query_write();
      calc();
   }


   // Recalc values after variables change
   function recalc() {   
      // Test variable changes
      var_read_id();
      if (var_test_change() == true) {
         var_backup();
         query_write();
         calc();
      }
   }
   
   
   // Calculate formulas and print values
   function calc() {
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

      {%- for rowdata in rows -%} {%- if rowdata.type in ['calc'] %}
      document.getElementById("{{rowdata.id}}").value = num_fix({{rowdata.id}}
         {%- if rowdata.prefix == 1 %} * 1.0{% else %} * {{ to_numexp_1(1.0/(rowdata.prefix|float)) }}{% endif %}, {{config.resolution}});
      {%- endif %} {%- endfor %}

      {%- for rowdata in rows -%} {%- if rowdata.type in ['const'] %}
      document.getElementById("{{rowdata.id}}").value = "{{rowdata.value}}";
      {%- endif %} {%- endfor %}
   }

{#- ********** Manage variables ********** #}

   // Read all variables
   function var_read_id() {

      {%- for rowdata in rows %} {%- if rowdata.type in ['var'] %}
      {{rowdata.id}} = idtonum("{{rowdata.id}}")
         {%- if rowdata.prefix == 1 %} * 1.0{% else %} * {{ to_numexp_1(rowdata.prefix|float) }}
         {%- endif %}; // Variable: {{rowdata.comment}}
      {%- endif %} {%- endfor %}

      {%- for rowdata in rows %} {%- if rowdata.type in ['const'] %}
      {{rowdata.id}} = ( {{rowdata.value}} ) * 1e0; // Constant: {{rowdata.comment}}
      {%- endif %} {%- endfor %}
   }

   // Reset variables to default values
   function var_reset() {

      {%- for rowdata in rows %} {%- if rowdata.type in ['var'] %}
      document.getElementById("{{rowdata.id}}").value =
         {%- if rowdata.value or rowdata.value == 0 %} {{rowdata.value}}{%- else %} ''{% endif %};
      {%- endif %} {%- endfor %}

      recalc();
   }

   // Clear variables
   function var_clear() {

      {%- for rowdata in rows %} {%- if rowdata.type in ['var'] %}
      document.getElementById("{{rowdata.id}}").value = '';
      {%- endif %} {%- endfor %}

      recalc();
   }

   // Test if there are variable changes
   var var_values = {};

   function var_test_change() {
      {%- for rowdata in rows %}{%- if rowdata.type in ['var'] %}
      if (var_values["{{rowdata.id}}"] != {{rowdata.id}}) return true;
      {%- endif %}{%- endfor %}
      return false;
   }

   // Copy values of variables
   function var_backup() {
      {%- for rowdata in rows %} {%- if rowdata.type in ['var'] %}
      var_values["{{rowdata.id}}"] = {{rowdata.id}};
      {%- endif %} {%- endfor %}
   }

   // Write values to variables
   function var_write(values) {
      for(var i=0; i<values.length; i++) {
         document.getElementById(values[i][0]).value = values[i][1];
      }
   }


{#- ********** Manage query strings ********** #}

   // Write query string into url
   function query_write () {
      var url = document.location.href.split('?')[0];
      var query = '?';
      var value;
      {%- for rowdata in rows %} {%- if rowdata.type in ['var'] %}
      value = encodeURIComponent(document.getElementById("{{rowdata.id}}").value)
      if (value.length) query = query + "{{rowdata.id}}=" + value + '&';
      {%- endif %} {%- endfor %}
      if (query.length > 1) url = url + query
      history.pushState({id: ''}, '{{config.title}}', url);
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

   window.onpopstate = function(event) {
      document.location.reload();
   };


{#- ********** Manage numbers ********** #}

   // Evalue inputs with '.' or ',' as comma
   function idtonum(id) {
      val = document.getElementById(id).value.replace(',', '.');
      if (isNaN(val)) return '';
      return val * 1e0; // return number
   }

   // Format number with fix digits
   function num_fix(number, digits) {
      if (!isFinite(number)) return '';
      if (number == 0) return '0';
      if (Math.sign(number) < 0)
         var sign = '-';
      else
         var sign = '';
      number = Math.abs(number)
      exp = Math.ceil(Math.log10(number) + 0.000001);
      number = Math.round(number * Math.pow(10, digits - exp)) + '';
      // Number have fractional part
      if (digits > exp) {
         // number have only fractional part
         if (exp <= 0) {
            return sign + '0.0000000'.substr(0, 2 - exp) + number;
         }
         // Number have integer and fractional part
         else {
            return sign + number.substr(0, exp) + '.' + number.substr(exp, digits - exp);
         }
      }
      // Number with only integer part
      else {
         number = number  + '0000000000'
         return sign + number.substr(0, exp);
      }
   }


{#- ********** Manage Keyboard events ********** #}

   // Manage keys [Enter] and [tab]
   function OnKeyPress(evt) {
      var evt = (evt) ? evt : ((event) ? event : null);
      var node = (evt.target) ? evt.target : ((evt.srcElement) ? evt.srcElement : null);
      if (node.type=="text") {
         if (evt.keyCode == 9) { recalc(); return; }
         if (evt.keyCode == 13) { recalc(); return false; }
      }
   }
   document.onkeypress = OnKeyPress;
