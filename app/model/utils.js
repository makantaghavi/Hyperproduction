// Adds a map range function to numbers
// var num = 5;
// console.log( num.map( -20 , 0 , -100 , 100 ) ); // 150
Number.prototype.map = function ( in_min , in_max , out_min , out_max ) {
  return ( this - in_min ) * ( out_max - out_min ) / ( in_max - in_min ) + out_min;
}

if (!Array.prototype.last){
    Array.prototype.last = function(){
        return this[this.length - 1];
    };
};

if (!Array.prototype.first){
    Array.prototype.first = function(){
        return this[0];
    };
};