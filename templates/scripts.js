{%- macro to_numexp_1(num) -%} {{"%1.0e"|format(num|float)}} {%- endmacro %}
{%- macro to_numexp_5(num) -%} {{"%5.4e"|format(num|float)}} {%- endmacro %}

{%- for inc in include %} {% if inc.type == 'script' %}

    // Include script: {{inc.name}}
    {% include inc.name %}
    
    // End {{inc.name}}

{%- endif %}{%- endfor %}


{#- Read variables, calculate formulaes and print results #}

    var values = {};
    
    // Setup variables onload 
    function setup() {
      reset_var();
      calc();
    }

    // Compute calculations
    function calc() {
    {%- for rowdata in rows %} {%- if rowdata.type == 'var' %}

       // Variable: {{rowdata.comment}}
       {{rowdata.id}} = idtonum("{{rowdata.id}}")
          {%- if rowdata.prefix != 1 %} * {{ to_numexp_1(rowdata.prefix|float) }}{% endif %};
    {%- endif %} {%- endfor %}

    {%- for rowdata in rows -%} {%- if rowdata.type == 'const' %}

       // Constant: {{rowdata.comment}}
       {{rowdata.id}} = {{rowdata.value}};
       document.getElementById("{{rowdata.id}}").value = "{{to_numexp_5(rowdata.value)}}";
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

    {%- for rowdata in rows -%} {%- if rowdata.type == 'calc' %}

       // Print calc: {{rowdata.comment}}
       document.getElementById("{{rowdata.id}}").value = num_fix({{rowdata.id}}
          {%- if rowdata.prefix != 1 %} * {{ to_numexp_1(1.0/rowdata.prefix|float) }}{% endif %}, {{config.resolution}});
    {%- endif %} {%- endfor %}
    }


{#- Reset variables to default values or Clear to zero #}

    // Reset variables to default values
    function reset_var() {
       {%- for rowdata in rows %} {%- if rowdata.type == 'var' %}
       document.getElementById("{{rowdata.id}}").value = {% if rowdata.value or rowdata.value == 0 %}{{rowdata.value}}{% else %}''{% endif %};
       {%- endif %} {%- endfor %}
       calc();
    }

    // Clear variables
    function clear_var() {
       {%- for rowdata in rows %} {%- if rowdata.type == 'var' %}
       document.getElementById("{{rowdata.id}}").value = '';
       {%- endif %} {%- endfor %}
       calc();
    }


{#- Manage numbers #}

    // Evalue inputs with '.' or ',' as comma
    function idtonum(id) {
       val = document.getElementById(id).value.replace(',', '.');
       if (val != values[val]) {
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
