
    <!-- Zero finding with secant method. https://en.wikipedia.org/wiki/Secant_method -->
    function zero_secant(x, fn) {
      var iter, x0, x1, x2, y0, y1;
      x1 = x * 1.0;
      y1 = fn(x1);
      x2 = x1 * 1.001 + 1e-8;
      for(iter=0; iter<40; iter++) {
        x0 = x1;
        y0 = y1;
        x1 = x2
        y1 = fn(x1);
        if ((Math.abs(y1) < 1e-50) || Math.abs((x1-x0)/x1) < 1e-12)     
          break;
        if (y0 == y1)
           x2 = x1 * 1.001 + 1e-8;
        else 
           x2 = x1 - y1*(x1-x0)/(y1-y0);
      }
      return x1;
    }

    
    <!-- Zero finding between two points -->
    function zero_bisect(x0, x1, fn) {
      var iter, x2, y0, y1, y2;
      x0 = x0 * 1.0;
      x1 = x1 * 1.0;
      y0 = fn(x0);
      y1 = func_1(x1);
      if (Math.sign(y0 * y1) != -1) 
        return '';
      for(iter=0; iter<80; iter++) {
        x2 = 0.5 * (x0 + x1);
        y2 = func_1(x2);
        if ((Math.abs(y2) < 1e-50) || Math.abs((x1-x0)/x1) < 1e-12)
          break;
        if (Math.sign(y2) == Math.sign(y1)) {
          y1 = y2;
          x1 = x2;
        }
        else {
          y0 = y2;
          x0 = x2;
        }
      }
      return x2;
    }