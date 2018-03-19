// Init calculations
function cookies_setup() {
   if  (cookies_read("saved") == 'true')
      cookies_var_load();
   else
      var_reset();
   calc();
}

// Save variables to cookie
function cookies_var_save() {
   var expiresdate = new Date(2068, 1, 02, 11, 20);
   expiresdate = "expires=" + expiresdate.toUTCString();
   var names = [{%- for datarow in rows %} {%- if datarow.type == 'var' %}"{{datarow.id}}", {% endif %} {%- endfor %} ];
   for(var i=0; i<names.length; i++) {
      document.cookie = names[i] + " = " + encodeURIComponent(idtonum(names[i])) + "; " + expiresdate;
   }
   document.cookie = "saved = true; " + expiresdate
}

// Load variables from cookie
function cookies_var_load() {
   {%- for datarow in rows %} {%- if datarow.type == 'var' %}
   document.getElementById("{{datarow.id}}").value = cookies_read("{{datarow.id}}");
   {%- endif %} {%- endfor %}
   calc();
}

// Read cookies
function cookies_read(name) {
   var re = new RegExp(name + "=([^;&]+)");
   var value = decodeURIComponent(re.exec(document.cookie));
   if (isFinite(value)) {
      return value;
   }
   else {
      return '';
   }
}