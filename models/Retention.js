var keystone = require('keystone'),
    Types = keystone.Field.Types;

/**
 * Retention Model
 * ==========
 */

var Retention = new keystone.List('Retention', {
    map: { name: 'logDate' }
});

Retention.add({
    logDate         :{type:Number,required:true,default:0 }
    // registers       :[{type:String}],
    // registerCount   :{type:Number,default:0},
    // retentions     :[{type:Number}],
});


/**
 * Registration
 */

Retention.defaultSort = '-logDate';
Retention.register();
