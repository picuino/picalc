{%- macro to_numexp_1(num) -%} {{"%1.0e"|format(num|float)}} {%- endmacro %}
{%- macro to_numexp_5(num) -%} {{"%5.4e"|format(num|float)}} {%- endmacro %}

{%- for inc in include %} {% if inc.type == 'script' %}

    // Include script: {{inc.name}}
    {% include inc.name %}
    
    // End {{inc.name}}

{%- endif %}{%- endfor %}


{#- Read variables, calculate formulaes and print results #}
    // Compute calculations
    function calc() {
    {%- for datarow in rows %} {%- if datarow.type == 'var' %}

       // Variable: {{datarow.comment}}
       {{datarow.id}} = tonum("{{datarow.id}}")
          {%- if datarow.prefix != 1 %} * {{ to_numexp_1(datarow.prefix|float) }}{% endif %};
    {%- endif %} {%- endfor %}

    {%- for datarow in rows -%} {%- if datarow.type == 'const' %}

       // Constant: {{datarow.comment}}
       {{datarow.id}} = {{datarow.value}};
       document.getElementById("{{datarow.id}}").value = "{{to_numexp_5(datarow.value)}}";
    {%- endif %} {%- endfor %}

    {%- for datarow in rows -%} {%- if datarow.type == 'calc' %}

       // Calculation: {{datarow.comment}}
       {%- if datarow.calc is iterable and datarow.calc is not string %}
       {%- for calc in datarow.calc %}
       {{calc}};
       {%- endfor %}
       {%- else %}
       {{datarow.calc}};
       {%- endif %}
    {%- endif %} {%- endfor %}

    {%- for datarow in rows -%} {%- if datarow.type == 'calc' %}

       // Print calc: {{datarow.comment}}
       document.getElementById("{{datarow.id}}").value = num_fix({{datarow.id}}
          {%- if datarow.prefix != 1 %} * {{ to_numexp_1(1.0/datarow.prefix|float) }}{% endif %}, {{config.resolution}});
    {%- endif %} {%- endfor %}
    }


{#- Reset variables to default values or Clear to zero #}

    // Reset variables to default values
    function reset_var() {
       {%- for datarow in rows %} {%- if datarow.type == 'var' %}
       document.getElementById("{{datarow.id}}").value = {% if datarow.value or datarow.value == 0 %}{{datarow.value}}{% else %}''{% endif %};
       {%- endif %} {%- endfor %}
       calc();
    }

    // Clear variables
    function clear_var() {
       {%- for datarow in rows %} {%- if datarow.type == 'var' %}
       document.getElementById("{{datarow.id}}").value = '';
       {%- endif %} {%- endfor %}
       calc();
    }


{#- Format float numbers #}

    // Evalue inputs with '.' or ',' as comma
    function tonum(id) {
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
