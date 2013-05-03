({

/** import x from "x.js"; **/
"import from a url": {
    type: "Script",
    statements: [
    {   type: "ImportDeclaration",
        specifiers: [
        {   type: "ImportSpecifier",
            remote: {
                type: "Identifier",
                value: "x"
            },
            local: null
        }],
        from: {
            type: "String",
            value: "x.js"
        }
    }]
},

/** import x from y; **/
"import from a lexical module": {
    type: "Script",
    statements: [
    {   type: "ImportDeclaration",
        specifiers: [
        {   type: "ImportSpecifier",
            remote: {
                type: "Identifier",
                value: "x"
            },
            local: null
        }],
        from: {
            type: "ModulePath",
            elements: [ 
            {   type: "Identifier",
                value: "y"
            }]
        }
    }]
},

/** import x as y from "x.js"; **/
"renaming imported bindings": {
    type: "Script",
    statements: [
    {   type: "ImportDeclaration",
        specifiers: [
        {   type: "ImportSpecifier",
            remote: {
                type: "Identifier",
                value: "x"
            },
            local: {
                type: "Identifier",
                value: "y"
            }
        }],
        from: {
            type: "String",
            value: "x.js"
        }
    }]
},

/** import "x.js" as x; **/
"import as": { 
    type: "Script",
    statements: [
    {   type: "ImportAsDeclaration",
        from: {
            type: "String",
            value: "x.js"
        },
        ident: {
            type: "Identifier",
            value: "x"
        }
    }]
},

})