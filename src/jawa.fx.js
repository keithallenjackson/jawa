    jawa.fn.extend("fx", function(name, types, fx_func) {
       if(!context[nodeName]) {
           throw "fx type does not exist";
       }
       if(!name) {
           throw "fx name not valid.";
       }
       var func = fx_func || function(){};
       var that = this;
       var chn = chain();
       var fx = [];
       var index = 0;
       var currentFx;
       
       if(typeof types === 'string') {
           types = [types];
       } 
       
       if(types instanceof Array) {
           for(; index < type.length; index++) {
               currentFx = context['create' + types[index]]();
               chn.add(currentFx);
               fx.push(currentFx);
           }
       } else {
           throw "Type neither a string or an array.";
       }

       jawa.fn.extend(name, function() {
           func.apply(this, fx);
       });
       
    });