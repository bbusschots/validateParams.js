//
// === Setup and other Prep Work ===============================================
//

// import the module under test
var validateParams = require('../');

// A library of dummy data and related functions to speed up data validation

/**
 * A collection of named dummy data definitions, each a plain object indexed
 * by `val` (the dummy data), and `desc` (an English description).
 *
 * This data is re-set before every test.
 */
var DUMMY_DATA = {};

/**
 * A sub-set of `DUMMY_DATA` covering only the basic types.
 *
 * This data is re-set before every test.
 */
var DUMMY_BASIC_TYPES = {};

// Add the event handler to re-set the dummy data before each test.
QUnit.testStart(function() {
    DUMMY_DATA = {
        undef: {
            desc: 'undefined',
            val: undefined
        },
        bool: {
            desc: 'a boolean',
            val: true
        },
        num: {
            desc: 'a number',
            val: 42,
        },
        str_empty: {
            desc: 'an empty string',
            val: ''
        },
        str: {
            desc: 'a generic string',
            val: 'boogers!'
        },
        arr_empty: {
            desc: 'an emptyy array',
            val: [],
        },
        arr: {
            desc: 'an array',
            val: [1, 2, 3],
        },
        obj_empty: {
            desc: 'an empty plain object',
            val: {},
        },
        obj: {
            desc: 'a plain object',
            val: {b: 'boogers'}
        },
        obj_proto: {
            desc: 'a prototyped object',
            val: new Error('dummy error object')
        },
        fn: {
            desc: 'a function object',
            val: function(a,b){ return a + b; }
        }
    };
    DUMMY_BASIC_TYPES = {
        undef: DUMMY_DATA.undef, 
        bool: DUMMY_DATA.bool,
        num: DUMMY_DATA.num,
        str: DUMMY_DATA.str,
        arr: DUMMY_DATA.arr,
        obj: DUMMY_DATA.obj,
        fn: DUMMY_DATA.fn
    };
});

/**
 * A function to return the names of all dummy basic types except those passed
 * as arguments.
 *
 * @param {...string} typeName The name of a basic type in `DUMMY_BASIC_TYPES`
 */
function dummyBasicTypesExcept(){
    // build and exclusion lookup from the arguments
    var exclude_lookup = {};
    for(var i = 0; i < arguments.length; i++){
        exclude_lookup[arguments[i]] = true;
    }
    
    // build the list of type names not excluded
    var ans = [];
    Object.keys(DUMMY_BASIC_TYPES).sort().forEach(function(tn){
        if(!exclude_lookup[tn]){
            ans.push(tn); // save the type name if not excluded
        }
    });
    
    // return the calculated list
    return ans;
}

//
// === Test the main Function ==================================================
//

QUnit.module('validateParams() function',
    {
        beforeEach: function(){
            this.dummyFn = function(){
                var errors = validateParams(arguments, [
                    {
                        presence: true,
                    },
                    {
                        presence: true,
                        numericality: true
                    },
                    {
                        numericality: true
                    }
                ]);
                if(errors){
                    throw new Error();
                }
            };
        }
    },
    function(){
        QUnit.test('function exists', function(a){
            a.equal(typeof validateParams, 'function');
        });
        
        QUnit.test('parameter number validation', function(a){
            a.expect(4);
            a.throws(
                function(){ validateParams(); },
                Error,
                'first argument required'
            );
            a.throws(
                function(){ validateParams([]); },
                Error,
                'second argument required'
            );
            a.ok((function(){ validateParams([], []); return true; })(), 'third argument is not required');
            a.ok((function(){ validateParams([], [], {}); return true; })(), 'third argument is allowed');
        });
        
        QUnit.test('params validation', function(a){
            var mustThrow = dummyBasicTypesExcept('arr');
            a.expect(mustThrow.length + 2);
            
            // make sure all the basic types excep array do indeed throw
            mustThrow.forEach(function(tn){
                a.throws(
                    function(){ validateParams(DUMMY_BASIC_TYPES[tn].val, []); },
                    Error,
                    'params not allowed to be ' + DUMMY_BASIC_TYPES[tn].desc
                );
            });
            
            // make sure an array does not throw
            a.ok((function(){ validateParams([], []); return true; })(), 'params can be an array');
            
            // make sure an Arguments object does not throw
            a.ok((function(){ validateParams(arguments, []); return true; })(), 'params can be an Arguments object');
        });
        
        QUnit.test('basic validation', function(a){
            var fn = this.dummyFn;
            
            a.expect(6);
            a.throws(
                function(){
                    fn();
                },
                Error,
                'error when two required arguments are missing'
            );
            a.throws(
                function(){
                    fn('stuff');
                },
                Error,
                'error when one required arguments are missing'
            );
            a.throws(
                function(){
                    fn('stuff', 'thingys');
                },
                Error,
                'error when all required arguments are present, but on is invalid'
            );
            a.throws(
                function(){
                    fn('stuff', 2, 'whatsists');
                },
                Error,
                'error when called valid values for all required params but an invalid value for an optional param'
            );
            a.ok((function(){ fn('stuff', 2); return true; })(), 'no error when all required params are present and valid');
            a.ok((function(){ fn('stuff', 2, 4); return true; })(), 'no error when all required params are present and valid, and an optional param is present and valid');
        });
    }
);

QUnit.module('validateParams.isArguments() function', {}, function(){
    QUnit.test('function exists', function(a){
        a.equal(typeof validateParams.isArguments, 'function');
    });
    
    QUnit.test('function correctly detects Arguments object', function(a){
        a.expect(Object.keys(DUMMY_BASIC_TYPES).length + 1);
        
        // make sure all dummy basic types return false
        Object.keys(DUMMY_BASIC_TYPES).sort().forEach(function(tn){
            a.equal(
                validateParams.isArguments(DUMMY_BASIC_TYPES[tn].val),
                false,
                DUMMY_BASIC_TYPES[tn].desc + ' is not an Arguments object'
            );
        });
        
        // make sure an Arguments object returns true
        a.equal(
            validateParams.isArguments(arguments),
            true,
            'arguments recognised as Arguments object'
        );
    });
});

QUnit.module('validateParams.asOrdinal() function', {}, function(){
    QUnit.test('function exists', function(a){
        a.equal(typeof validateParams.asOrdinal, 'function');
    });
    
    QUnit.test('function produced expected outputs', function(a){
        a.expect(30);
        
        // test single-digit numbers
        a.equal(validateParams.asOrdinal(0), '0th');
        a.equal(validateParams.asOrdinal(1), '1st');
        a.equal(validateParams.asOrdinal(2), '2nd');
        a.equal(validateParams.asOrdinal(3), '3rd');
        a.equal(validateParams.asOrdinal(4), '4th');
        
        // test the teens
        a.equal(validateParams.asOrdinal(10), '10th');
        a.equal(validateParams.asOrdinal(11), '11th');
        a.equal(validateParams.asOrdinal(12), '12th');
        a.equal(validateParams.asOrdinal(13), '13th');
        a.equal(validateParams.asOrdinal(14), '14th');
        
        // test regular 2-digit numbers
        a.equal(validateParams.asOrdinal(30), '30th');
        a.equal(validateParams.asOrdinal(31), '31st');
        a.equal(validateParams.asOrdinal(32), '32nd');
        a.equal(validateParams.asOrdinal(33), '33rd');
        a.equal(validateParams.asOrdinal(34), '34th');
        
        // test three-digit numbers
        a.equal(validateParams.asOrdinal(100), '100th');
        a.equal(validateParams.asOrdinal(101), '101st');
        a.equal(validateParams.asOrdinal(102), '102nd');
        a.equal(validateParams.asOrdinal(103), '103rd');
        a.equal(validateParams.asOrdinal(104), '104th');
        a.equal(validateParams.asOrdinal(110), '110th');
        a.equal(validateParams.asOrdinal(111), '111th');
        a.equal(validateParams.asOrdinal(112), '112th');
        a.equal(validateParams.asOrdinal(113), '113th');
        a.equal(validateParams.asOrdinal(114), '114th');
        a.equal(validateParams.asOrdinal(120), '120th');
        a.equal(validateParams.asOrdinal(121), '121st');
        a.equal(validateParams.asOrdinal(122), '122nd');
        a.equal(validateParams.asOrdinal(123), '123rd');
        a.equal(validateParams.asOrdinal(124), '124th');
    });
});