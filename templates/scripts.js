{%- macro to_numexp_1(num) -%} {{"%1.0e"|format(num|float)}} {%- endmacro %}
{%- macro to_numexp_5(num) -%} {{"%5.4e"|format(num|float)}} {%- endmacro %}

{%- for inc in include %} {% if inc.type == 'script' %}

    // Include script: {{inc.name}}
    {% include inc.name %}
    
    // End {{inc.name}}

{%- endif %}{%- endfor %}


{#- Read variables, calculate formulaes and print results #}

    // Setup variables onload 
    function setup() {
      reset_var();
      calc();
    }

    // Compute calculations
    function calc() {
      
       // Test variable changes
       if (test_var_change() == false)
          return;

       read_vars();
       copy_var_values();
       add_query();

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
       print_var();
    }
    
    // Add query string to url
    function add_query () {
       var url = document.URL.split('?')[0];
       var query = '';
       
       {% for rowdata in rows -%} {%- if rowdata.type == 'var' %}
       query = query + "{{rowdata.id}}=" + {{rowdata.id}} + '&'; 
       {%- endif %} {%- endfor %}
       
       history.pushState({id: 'homepage'}, '{{config.title}}', url + '?' + query);       
    }
    
    
    // Print calcs
    function print_var() {
       {%- for rowdata in rows -%} {%- if rowdata.type == 'calc' %}

       // Print calc: {{rowdata.comment}}
       document.getElementById("{{rowdata.id}}").value = num_fix({{rowdata.id}}
          {%- if rowdata.prefix != 1 %} * {{ to_numexp_1(1.0/rowdata.prefix|float) }}{% endif %}, {{config.resolution}});
          
       {%- endif %} {%- endfor %}
    }
    
    // Test if there are variable changes
    var var_values = {};    

    function test_var_change() {
       {%- for rowdata in rows %}{%- if rowdata.type == 'var' %}
       if (var_values[{{rowdata.id}}] != document.getElementById("{{rowdata.id}}").value) return true;       
       {%- endif %}{%- endfor %}
       return false;
    }
    
    // Read all variables
    function read_vars() {
       {%- for rowdata in rows %} {%- if rowdata.type == 'var' %}

       // Variable: {{rowdata.comment}}
       {{rowdata.id}} = idtonum("{{rowdata.id}}")
          {%- if rowdata.prefix != 1 %} * {{ to_numexp_1(rowdata.prefix|float) }}{% endif %};
       
       {%- endif %} {%- endfor %}
    }
    
    // Copy values of variables
    function copy_var_values() {
      
       {%- for rowdata in rows %} {%- if rowdata.type == 'var' %}

       var_values["{{rowdata.id}}"] = {{rowdata.id}};
       
       {%- endif %} {%- endfor %}
    }

    // Reset variables to default values
    function reset_var() {
      
       {%- for rowdata in rows %} {%- if rowdata.type == 'var' -%}
       document.getElementById("{{rowdata.id}}").value = 
          {%- if rowdata.value or rowdata.value == 0 -%}{{rowdata.value}}{%- else %}''{% endif %};
       {{rowdata.id}} = 
          {%- if rowdata.value or rowdata.value == 0 -%}{{rowdata.value}}{%- else %}''{% endif %};
       {%- endif %} {%- endfor %}
    }

    // Clear variables
    function clear_var() {
      
       {%- for rowdata in rows %} {%- if rowdata.type == 'var' %}
       
       document.getElementById("{{rowdata.id}}").value = '';
       {{rowdata.id}} = '';
       
       {%- endif %} {%- endfor %}
    }


{#- Manage numbers #}

    // Evalue inputs with '.' or ',' as comma
    function idtonum(id) {
       val = document.getElementById(id).value.replace(',', '.');
       if (isNaN(val)) return '';
       return val * 1.0; // return number
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


{#- Manage Keyboard events #}

    // Manage keys [Enter] and [tab]
    function OnKeyPress(evt) {
       var evt = (evt) ? evt : ((event) ? event : null);
       var node = (evt.target) ? evt.target : ((evt.srcElement) ? evt.srcElement : null);
       if (node.type=="text") {
          if (evt.keyCode == 9) { calc(); return; }
         if (evt.keyCode == 13) { calc(); return false; }
       }
    }
    document.onkeypress = OnKeyPress;
