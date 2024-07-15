
// Import what we're testing
import Validation from '../src/validation.js'
import { } from '../src/validation/float-arithmetic.js'

// Import other classes we need to do the testing
import { MathConcept } from '../src/math-concept.js'
import { LogicConcept } from '../src/logic-concept.js'
import { Environment } from '../src/environment.js'
import { Application } from '../src/application.js'
import { Symbol as LurchSymbol } from '../src/symbol.js'
import Formula from '../src/formula.js'
import Scoping from '../src/scoping.js'
import Database from '../src/database.js'

// Import the spy function tool for testing callbacks/handlers
import { makeSpy } from './test-utils.js'

// Test suite begins here.

describe( 'Validation', function () {

    // This takes a long time, so increase the timeout threshold.
    this.timeout( 25000 )
        
    it( 'Module should import successfully', () => {
        expect( Validation ).to.be.ok
    } )

    it( 'Should report presence of built-in tools', () => {
        // installedToolNames is a function
        expect( Validation.installedToolNames ).to.be.ok
        // it returns a non-empty array
        let test = Validation.installedToolNames()
        expect( test ).to.be.instanceof( Array )
        expect( test ).to.have.lengthOf.above( 0 )
        // it includes at least the following default validation tools
        expect( test ).to.include( 'floating point arithmetic' )
        expect( test ).to.include( 'classical propositional logic' )
        expect( test ).to.include( 'intuitionistic propositional logic' )
        expect( test ).to.include( 'CAS' )
        // some tool is the default and it's on the list
        expect( Validation.getOptions ).to.be.ok
        expect( test ).to.include( Validation.getOptions().tool )
    } )

    const dummySpy = makeSpy()
    const dummyResult = {
        result : 'indeterminate',
        reason : 'Just a dummy tool'
    }
    const dummyTool = ( ...args ) => {
        dummySpy( ...args )
        return dummyResult
    }

    it( 'Should let us install new tools', () => {
        expect( Validation.installedToolNames() ).to.not.include( 'dummy' )
        expect( Validation.installTool ).to.be.ok
        expect(
            () => Validation.installTool( 'dummy',
                Validation.functionToTool( dummyTool ) )
        ).not.to.throw()
        expect( Validation.installedToolNames() ).to.include( 'dummy' )
        expect(
            () => Validation.installConclusionsVersion( 'dummy' )
        ).not.to.throw()
        expect( Validation.installedToolNames() ).to.include(
            'dummy on conclusions' )
    } )

    it( 'Should call validation tools on all conclusions', () => {
        // Create an LC with several conclusions and several non-conclusions
        let test = LogicConcept.fromPutdown( `
        {
            {
                concl1
                :given1
                {
                    (this is concl2)
                }
            }
            :{ none of these are conclusions }
            concl3
        }
        ` )[0]

        // Set the dummy validation tool as the default
        expect( () => Validation.setOptions( 'tool', 'dummy' ) ).not.to.throw()
        // Clear the dummy tool's call record,
        // then run validation on the above LC
        dummySpy.callRecord = [ ]
        expect( () => Validation.validate( test ) ).not.to.throw()
        // Ensure that only the top-level environment got validated
        expect( dummySpy.callRecord ).to.have.lengthOf( 1 )
        expect( dummySpy.callRecord[0] ).to.have.lengthOf( 2 )
        expect( dummySpy.callRecord[0][0] ).to.equal( test )
        expect( dummySpy.callRecord[0][1] ).to.eql( { 'tool' : 'dummy' } )
        // Ensure that no other descendants of the document had validation
        // results stored into them
        expect( Validation.result( test.child( 0 ) ) )
            .to.be.undefined
        expect( Validation.result( test.child( 0, 0 ) ) )
            .to.be.undefined
        expect( Validation.result( test.child( 0, 1 ) ) )
            .to.be.undefined
        expect( Validation.result( test.child( 0, 2 ) ) )
            .to.be.undefined
        expect( Validation.result( test.child( 0, 2, 0 ) ) )
            .to.be.undefined
        expect( Validation.result( test.child( 0, 2, 0, 0 ) ) )
            .to.be.undefined
        expect( Validation.result( test.child( 0, 2, 0, 1 ) ) )
            .to.be.undefined
        expect( Validation.result( test.child( 0, 2, 0, 2 ) ) )
            .to.be.undefined
        expect( Validation.result( test.child( 1 ) ) )
            .to.be.undefined
        expect( Validation.result( test.child( 1, 0 ) ) )
            .to.be.undefined
        expect( Validation.result( test.child( 1, 1 ) ) )
            .to.be.undefined
        expect( Validation.result( test.child( 1, 2 ) ) )
            .to.be.undefined
        expect( Validation.result( test.child( 1, 3 ) ) )
            .to.be.undefined
        expect( Validation.result( test.child( 1, 4 ) ) )
            .to.be.undefined
        expect( Validation.result( test.child( 2 ) ) )
            .to.be.undefined

        // Set the dummy validation tool on conclusions as the default
        expect(
            () => Validation.setOptions( 'tool', 'dummy on conclusions' )
        ).not.to.throw()
        // Clear the dummy tool's call record,
        // then run validation on the above LC
        dummySpy.callRecord = [ ]
        expect( () => Validation.validate( test ) ).not.to.throw()
        // Ensure that all the conclusions got validated
        expect( dummySpy.callRecord ).to.have.lengthOf( 3 )
        expect( dummySpy.callRecord[0] ).to.have.lengthOf( 2 )
        expect( dummySpy.callRecord[0][0] ).to.equal( test.child( 0, 0 ) )
        expect( dummySpy.callRecord[0][1] ).to.eql( { 'tool' : 'dummy' } )
        expect( dummySpy.callRecord[1] ).to.have.lengthOf( 2 )
        expect( dummySpy.callRecord[1][0] ).to.equal( test.child( 0, 2, 0 ) )
        expect( dummySpy.callRecord[1][1] ).to.eql( { 'tool' : 'dummy' } )
        expect( dummySpy.callRecord[2] ).to.have.lengthOf( 2 )
        expect( dummySpy.callRecord[2][0] ).to.equal( test.child( 2 ) )
        expect( dummySpy.callRecord[2][1] ).to.eql( { 'tool' : 'dummy' } )
        // Ensure that all the relevant data was stored in those conclusions
        expect( Validation.result( test.child( 0, 0 ) ) )
            .to.eql( dummyResult )
        expect( Validation.result( test.child( 0, 2, 0 ) ) )
            .to.eql( dummyResult )
        expect( Validation.result( test.child( 2 ) ) )
            .to.eql( dummyResult )
        // Ensure that no other descendants of the document had validation
        // results stored into them
        expect( Validation.result( test.child( 0 ) ) )
            .to.be.undefined
        expect( Validation.result( test.child( 0, 1 ) ) )
            .to.be.undefined
        expect( Validation.result( test.child( 0, 2 ) ) )
            .to.be.undefined
        expect( Validation.result( test.child( 0, 2, 0, 0 ) ) )
            .to.be.undefined
        expect( Validation.result( test.child( 0, 2, 0, 1 ) ) )
            .to.be.undefined
        expect( Validation.result( test.child( 0, 2, 0, 2 ) ) )
            .to.be.undefined
        expect( Validation.result( test.child( 1 ) ) )
            .to.be.undefined
        expect( Validation.result( test.child( 1, 0 ) ) )
            .to.be.undefined
        expect( Validation.result( test.child( 1, 1 ) ) )
            .to.be.undefined
        expect( Validation.result( test.child( 1, 2 ) ) )
            .to.be.undefined
        expect( Validation.result( test.child( 1, 3 ) ) )
            .to.be.undefined
        expect( Validation.result( test.child( 1, 4 ) ) )
            .to.be.undefined
    } )

    it( 'Should let us clear validation results out of conclusions', () => {
        // Re-run same test as in previous function
        let test = LogicConcept.fromPutdown( `
        {
            {
                concl1
                :given1
                {
                    (this is concl2)
                }
            }
            :{ none of these are conclusions }
            concl3
        }
        ` )[0]
        Validation.setOptions( 'tool', 'dummy on conclusions' )
        Validation.validate( test )
        // Ensure that all the relevant data was stored in those conclusions
        expect( Validation.result( test.child( 0, 0 ) ) )
            .to.eql( dummyResult )
        expect( Validation.result( test.child( 0, 2, 0 ) ) )
            .to.eql( dummyResult )
        expect( Validation.result( test.child( 2 ) ) )
            .to.eql( dummyResult )
        // Now erase it
        expect( () => {
            Validation.clearResult( test.child( 0, 0 ) )
            Validation.clearResult( test.child( 0, 2, 0 ) )
            Validation.clearResult( test.child( 2 ) )
        } ).not.to.throw()
        // And verify that it is gone
        expect( Validation.result( test.child( 0, 0 ) ) ).to.be.undefined
        expect( Validation.result( test.child( 0, 2, 0 ) ) ).to.be.undefined
        expect( Validation.result( test.child( 2 ) ) ).to.be.undefined
    } )

    it( 'Should do simple arithmetic validation', () => {
        Validation.setOptions( 'tool',
            'floating point arithmetic on conclusions' )
        // Yes, 2+5=10-3
        let test = LogicConcept.fromPutdown( `
        {
            (= (+ 2 5) (- 10 3))
        }
        ` )[0]
        expect( Validation.result( test ) ).to.be.undefined
        expect( Validation.result( test.child( 0 ) ) ).to.be.undefined
        Validation.validate( test )
        expect( Validation.result( test ) ).to.be.undefined
        expect( Validation.result( test.child( 0 ) ) ).to.eql( {
            result : 'valid',
            reason : 'JavaScript floating point check'
        } )
        // No, 5/2 is not the same as 2/5
        test = LogicConcept.fromPutdown( `
        {
            (= (/ 5 2) (/ 2 5))
        }
        ` )[0]
        expect( Validation.result( test ) ).to.be.undefined
        expect( Validation.result( test.child( 0 ) ) ).to.be.undefined
        Validation.validate( test )
        expect( Validation.result( test ) ).to.be.undefined
        expect( Validation.result( test.child( 0 ) ) ).to.eql( {
            result : 'invalid',
            reason : 'JavaScript floating point check'
        } )
        // Invalid structures cause errors
        test = LogicConcept.fromPutdown( `
        {
            (= (/ 1 2 3) 6)
        }
        ` )[0]
        expect( Validation.result( test ) ).to.be.undefined
        expect( Validation.result( test.child( 0 ) ) ).to.be.undefined
        Validation.validate( test )
        expect( Validation.result( test ) ).to.be.undefined
        let result = Validation.result( test.child( 0 ) )
        expect( result ).to.be.instanceof( Object )
        expect( result.result ).to.equal( 'invalid' )
        expect( result.reason ).to.equal( 'Invalid expression structure' )
        expect( result.message ).to.match( /Wrong number of arguments/ )
        expect( result.stack ).not.to.be.undefined
    } )

    it( 'Should do simple CAS validation', () => {
        Validation.setOptions( 'tool', 'CAS on conclusions' )
        // Yes, 2x+5x=10x-3x
        let test = LogicConcept.fromPutdown( `
        {
            (= (+ (* 2 x) (* 5 x)) (- (* 10 x) (* 3 x)) )
        }
        ` )[0]
        expect( Validation.result( test ) ).to.be.undefined
        expect( Validation.result( test.child( 0 ) ) ).to.be.undefined
        Validation.validate( test.child( 0 ) )
        expect( Validation.result( test ) ).to.be.undefined
        expect( Validation.result( test.child( 0 ) ) ).to.eql( {
            result : 'valid',
            reason : 'CAS',
            value : '1'
        } )
        // No, 5/(2+x) is not the same as (2+x)/5 (except for x=3 and x=-7 :))
        test = LogicConcept.fromPutdown( `
        {
            (= (/ 5 (+ 2 x)) (/ (+ 2 x) 5))
        }
        ` )[0]
        expect( Validation.result( test ) ).to.be.undefined
        expect( Validation.result( test.child(0) ) ).to.be.undefined
        Validation.validate( test )
        expect( Validation.result( test ) ).to.be.undefined
        expect( Validation.result( test.child( 0 ) ) ).to.eql( {
            result : 'invalid',
            reason : 'CAS',
            value : 'check(5/(x+2)=(x+2)*1/5)'
        } )
        // Invalid structures are also invalid
        test = LogicConcept.fromPutdown( `
        {
            (= (/ 1 2 x) 6)
        }
        ` )[0]
        expect( Validation.result( test ) ).to.be.undefined
        expect( Validation.result( test.child(0) ) ).to.be.undefined
        Validation.validate( test )
        expect( Validation.result( test.child( 0 ) ) ).to.eql( {
            result : 'invalid',
            reason : 'CAS',
            value : '0'
        } )
    } )

    it( 'Should give options the correct priorities', () => {
        // Set a module-level option
        Validation.setOptions( 'tool',
            'floating point arithmetic on conclusions' )
        // Create a test that has one conclusion-level option
        let test = LogicConcept.fromPutdown( `
        {
            (= (+ 9 2) (- 13 2))
            (= (+ (* 2 x) (* 5 x)) (- (* 10 x) (* 3 x)) )
                +{"validation options":{"tool":"CAS"}}
        }
        ` )[0]
        // Validate all and ensure the latter overrode the former in one case:
        expect( Validation.result( test.child( 0 ) ) ).to.be.undefined
        expect( Validation.result( test.child( 1 ) ) ).to.be.undefined
        Validation.validate( test )
        expect( Validation.result( test.child( 0 ) ) ).to.eql( {
            result : 'valid',
            reason : 'JavaScript floating point check'
        } )
        expect( Validation.result( test.child( 1 ) ) ).to.eql( {
            result : 'valid',
            reason : 'CAS',
            value : '1'
        } )
        // Now re-validate but pass the dummy tool as the one that should be
        // used, and it should apply it to each conclusion in the document that
        // did not already have a validation function specified:
        dummySpy.callRecord = [ ]
        Validation.validate( test, { tool : 'dummy on conclusions' } )
        expect( dummySpy.callRecord ).to.have.length( 1 )
        expect( dummySpy.callRecord[0] ).to.have.lengthOf( 2 )
        expect( dummySpy.callRecord[0][0] ).to.equal( test.child( 0 ) )
        expect( dummySpy.callRecord[0][1] ).to.eql( { 'tool' : 'dummy' } )
        expect( Validation.result( test.child( 0 ) ) )
            .to.eql( dummyResult )
        expect( Validation.result( test.child( 1 ) ) ).to.eql( {
            result : 'valid',
            reason : 'CAS',
            value : '1'
        } )
    } )

    it( 'Should do simple propositional validation', () => {
        Validation.setOptions( 'tool',
            'classical propositional logic on conclusions' )
        // Yes, things follow from given copies of the exact same thing
        let test = LogicConcept.fromPutdown( `
        {
            :A :B A B
        }
        ` )[0]
        expect( Validation.result( test ) ).to.be.undefined
        expect( Validation.result( test.child( 0 ) ) ).to.be.undefined
        expect( Validation.result( test.child( 1 ) ) ).to.be.undefined
        expect( Validation.result( test.child( 2 ) ) ).to.be.undefined
        expect( Validation.result( test.child( 3 ) ) ).to.be.undefined
        Validation.validate( test )
        expect( Validation.result( test ) ).to.be.undefined
        expect( Validation.result( test.child( 0 ) ) ).to.be.undefined
        expect( Validation.result( test.child( 1 ) ) ).to.be.undefined
        expect( Validation.result( test.child( 2 ) ) ).to.eql( {
            result : 'valid',
            reason : 'Classical Propositional Logic'
        } )
        expect( Validation.result( test.child( 3 ) ) ).to.eql( {
            result : 'valid',
            reason : 'Classical Propositional Logic'
        } )
        // Yes, modus ponens works, even on compound expressions, but the
        // unjustified conclusion does not validate.
        test = LogicConcept.fromPutdown( `
        {
            :{ :(= a b) (> 3 -1) } (= a b) (> 3 -1)
        }
        ` )[0]
        expect( Validation.result( test ) ).to.be.undefined
        expect( Validation.result( test.child( 0 ) ) ).to.be.undefined
        expect( Validation.result( test.child( 0, 0 ) ) ).to.be.undefined
        expect( Validation.result( test.child( 0, 1 ) ) ).to.be.undefined
        expect( Validation.result( test.child( 1 ) ) ).to.be.undefined
        expect( Validation.result( test.child( 2 ) ) ).to.be.undefined
        Validation.validate( test )
        expect( Validation.result( test ) ).to.be.undefined
        expect( Validation.result( test.child( 0 ) ) ).to.be.undefined
        expect( Validation.result( test.child( 0, 0 ) ) ).to.be.undefined
        expect( Validation.result( test.child( 0, 1 ) ) ).to.be.undefined
        expect( Validation.result( test.child( 1 ) ) ).to.eql( {
            result : 'invalid',
            reason : 'Classical Propositional Logic'
        } )
        expect( Validation.result( test.child( 2 ) ) ).to.eql( {
            result : 'valid',
            reason : 'Classical Propositional Logic'
        } )
        // Repeat the same two tests again, this time using intuitionistic
        // propositional logic instead of classical.
        Validation.setOptions( 'tool',
            'intuitionistic propositional logic on conclusions' )
        // Repeating Test 1...
        test = LogicConcept.fromPutdown( `
        {
            :A :B A B
        }
        ` )[0]
        expect( Validation.result( test ) ).to.be.undefined
        expect( Validation.result( test.child( 0 ) ) ).to.be.undefined
        expect( Validation.result( test.child( 1 ) ) ).to.be.undefined
        expect( Validation.result( test.child( 2 ) ) ).to.be.undefined
        expect( Validation.result( test.child( 3 ) ) ).to.be.undefined
        Validation.validate( test )
        expect( Validation.result( test ) ).to.be.undefined
        expect( Validation.result( test.child( 0 ) ) ).to.be.undefined
        expect( Validation.result( test.child( 1 ) ) ).to.be.undefined
        expect( Validation.result( test.child( 2 ) ) ).to.eql( {
            result : 'valid',
            reason : 'Intuitionistic Propositional Logic'
        } )
        expect( Validation.result( test.child( 3 ) ) ).to.eql( {
            result : 'valid',
            reason : 'Intuitionistic Propositional Logic'
        } )
        // Repeating Test 2...
        test = LogicConcept.fromPutdown( `
        {
            :{ :(= a b) (> 3 -1) } (= a b) (> 3 -1)
        }
        ` )[0]
        expect( Validation.result( test ) ).to.be.undefined
        expect( Validation.result( test.child( 0 ) ) ).to.be.undefined
        expect( Validation.result( test.child( 0, 0 ) ) ).to.be.undefined
        expect( Validation.result( test.child( 0, 1 ) ) ).to.be.undefined
        expect( Validation.result( test.child( 1 ) ) ).to.be.undefined
        expect( Validation.result( test.child( 2 ) ) ).to.be.undefined
        Validation.validate( test )
        expect( Validation.result( test ) ).to.be.undefined
        expect( Validation.result( test.child( 0 ) ) ).to.be.undefined
        expect( Validation.result( test.child( 0, 0 ) ) ).to.be.undefined
        expect( Validation.result( test.child( 0, 1 ) ) ).to.be.undefined
        expect( Validation.result( test.child( 1 ) ) ).to.eql( {
            result : 'invalid',
            reason : 'Intuitionistic Propositional Logic'
        } )
        expect( Validation.result( test.child( 2 ) ) ).to.eql( {
            result : 'valid',
            reason : 'Intuitionistic Propositional Logic'
        } )
    } )

    it( 'should correctly validate propositional database entries', () => {
        // Get all propositional validation tests from the database
        const propositionalTests = Database.filterByMetadata( metadata =>
            metadata.testing && metadata.testing.type &&
            metadata.testing.type == 'validation' &&
            metadata.testing.subtype &&
            metadata.testing.subtype == 'propositional' )
        // they are all entitled "/path/filename N.putdown" for some N,
        // so sort them by that value of N in increasing order.
        const getNum = key => {
            const parts = key.split( ' ' )
            return parseInt( parts.last().split( '.' )[0] )
        }
        propositionalTests.sort( ( a, b ) => getNum( a ) - getNum( b ) )
        
        // Now run each test as follows...
        Validation.setOptions( 'tool',
            'classical propositional logic on conclusions' )
        propositionalTests.forEach( key => {
            // Look up the test with the given key and ensure it contains
            // exactly one LogicConcept
            const LCs = Database.getObjects( key )
            expect( LCs.length ).equals( 1,
                `Malformed test: ${key} had ${LCs.length} LCs instead of 1` )
            const test = LCs[0]
            // Compute the set of conclusions in the LC to be validated and
            // ensure that none of them have been validated yet.
            const conclusions = test instanceof Environment ?
                test.conclusions() : [ test ]
            expect( conclusions.every( C => !Validation.result( C ) ) )
                .equals( true,
                    `Malformed test: ${key} has at least 1 validation result` )
            // Validate the entire LC we loaded.
            Validation.validate( test )
            test.descendantsSatisfying( d => true ).forEach( d => {
                const result = Validation.result( d )
                const expected = d.getAttribute( 'expected validation result' )
                if ( typeof expected == 'undefined' )
                    expect( result, `${key}@${d.address( test )}` )
                        .to.be.undefined
                else
                    expect( result.result, `${key}@${d.address( test )}` )
                        .equals( expected )
            } )
        } )
    } )

    // Utility function to find any command of the form \[in]valid[{...}] and
    // turn it into an attribute on its previous sibling, marking it as
    // expecting it to be valid/invalid for this test.
    // Used in tests below.
    const processValidityCommands = LC => {
        LC.descendantsSatisfying( d => {
            const interpAs = d.getAttribute( "Interpret as" )
            return ( interpAs instanceof Array )
                && interpAs[0] == 'command'
                && ( interpAs[1] == 'valid' || interpAs[1] == 'invalid' )
        } ).map( validityMarker => {
            const interpAs = validityMarker.getAttribute( "Interpret as" )
            const target = validityMarker.previousSibling()
            if ( !target ) throw new Error(
                `${validityMarker.toSmackdown()} with no previous sibling` )
            const expected = { result : interpAs[1] }
            const message = interpAs.slice( 2 ).join( ' ' )
            if ( message ) expected.message = message
            target.setAttribute( 'expected validation result', expected )
            validityMarker.remove()
        } )
    }

    // Utility function to find any LC of the form
    // (instantiation
    //   (formula "formula name")
    //   (pairs...) // e.g. ((P a) (Q b))
    //   (result [in]valid)
    //   (reason "some text") // this line optional
    // )
    // and parse it into a corresponding JSON structure.
    const parseInstantiation = LC => {
        // Verify overall form
        if ( !( LC instanceof Application ) )
            throw new Error( 'Instantiation must be an Application LC' )
        if ( LC.numChildren() != 4 && LC.numChildren() != 5 )
            throw new Error( 'Wrong number of children in instantiation LC' )
        if ( !LC.allButFirstChild().every(
                child => child instanceof Application ) )
            throw new Error(
                'Every child of an instantiation must be an Application' )
        // Verify formula block (child at index 1)
        if ( !LC.child( 1, 0 ).equals( new LurchSymbol( 'formula' ) )
          || !( LC.child( 1, 1 ) instanceof LurchSymbol )
          || LC.child( 1 ).numChildren() != 2 )
            throw new Error( 'Incorrect formula block in instantiation' )
        const formula = LC.child( 1, 1 ).text()
        // Verify pairs block (child at index 2)
        if ( !LC.child( 2 ).children().every(
                child => child instanceof Application )
          || !LC.child( 2 ).children().every(
                child => child.numChildren() == 2 )
          || !LC.child( 2 ).children().every(
                child => child.child( 0 ) instanceof LurchSymbol ) )
            throw new Error( 'Incorrect pairs list in instantiation' )
        const pairs = { }
        LC.child( 2 ).children().forEach( pair =>
            pairs[pair.child( 0 ).text()] = pair.child( 1 ) )
        // Verify result block (child at index 3)
        if ( !LC.child( 3, 0 ).equals( new LurchSymbol( 'result' ) )
          || !( LC.child( 3, 1 ) instanceof LurchSymbol )
          || LC.child( 3 ).numChildren() != 2 )
            throw new Error( 'Incorrect result block in instantiation' )
        const result = LC.child( 3, 1 ).text()
        // Construct final result now, although we may edit it below
        const parsed = {
            formula : formula,
            instantiation : pairs,
            result : result,
            original : LC
        }
        // Verify reason block (child at index 4, if any)
        if ( LC.numChildren() == 5 ) {
            if ( !LC.child( 4, 0 ).equals( new LurchSymbol( 'reason' ) )
              || !( LC.child( 4, 1 ) instanceof LurchSymbol )
              || LC.child( 4 ).numChildren() != 2 )
                throw new Error( 'Incorrect reason block in instantiation' )
            const reason = LC.child( 4, 1 ).text()
            parsed.reason = reason
        }
        // Done
        return parsed
    }

    // Utility function used by tests below.  Find an LC with the given label
    // that's anywhere inside the given LC.
    const descendantLabelLookup = (
        insideThis, withThisLabel, accessibleToThis, debugText,
        expectedResult, expectedReason
    ) => {
        for ( const descendant of insideThis.descendantsIterator() ) {
            if ( descendant.getAttribute( 'label' ) == withThisLabel ) {
                // If they expect it to be accessible to something, check that:
                if ( accessibleToThis
                  && !descendant.isAccessibleTo( accessibleToThis ) )
                    return expectInvalidity(
                        `${debugText}: inaccessible \\ref{}`,
                        'formula not accessible',
                        expectedResult, expectedReason )
                // Otherwise we're good to return this as the cited LC:
                return descendant
            }
        }
        // Could not find the referenced thing...expect that this was supposed
        // to happen:
        expectInvalidity( `${debugText}: bad \\ref{}`, 'no such formula',
                          expectedResult, expectedReason )
    }

    // Utility function:  Often we know that a LogicConcept has failed a
    // validation test, and we need to check that the test itself expects
    // exactly that result, possibly with a specific error message provided by
    // the test, which we must check against the actual failure reason.
    const expectInvalidity = (
        description, // text description for ease of debugging when testing
        reasonForInvalidity, // actual reason why the LogicConcept is invalid
        resultFromTest, // valid/invalid, expected result from test suite
        reasonFromTest // expected reason given in test suite (optional)
    ) => {
        expect( resultFromTest, description ).to.equal( 'invalid' )
        expect( ( typeof reasonFromTest == 'undefined' )
             || reasonFromTest == reasonForInvalidity,
            description + ' (checking reason text)'
        ).to.equal( true )
    }
    // Same as above, but for validity
    const expectValidity = (
        description, // text description for ease of debugging when testing
        reasonForValidity, // actual reason why the LogicConcept is valid
        resultFromTest, // valid/invalid, expected result from test suite
        reasonFromTest // expected reason given in test suite (optional)
    ) => {
        expect( resultFromTest, description ).to.equal( 'valid' )
        expect( ( typeof reasonFromTest == 'undefined' )
             || reasonFromTest == reasonForValidity,
            description + ' (checking reason text)'
        ).to.equal( true )
    }

    // Utility function:  Run the validation algorithm on the sequent for a
    // given claim, and return the time the actual validation algorithm took.
    const validateSequentFor = ( claim, key ) => {
        const location = `${key}@${claim.address()}`
        // Validate the conclusion propositionally and compare the
        // validation result to the \[in]valid{} marker on the
        // conclusion as part of the test.
        const sequent = new Validation.Sequent( claim )
        const startTime = new Date
        Validation.validate( sequent )
        const endTime = new Date
        // check to see if we got the right result
        const expected = claim.getAttribute(
            'expected validation result' )
        const actual = Validation.result( sequent.conclusion() )

        if ( actual.result != expected.result )
            console.log( sequent.toPutdown() )

        expect( actual.result ).to.equal( expected.result,
            `${location} has wrong validation result` )
        if ( expected.hasOwnProperty( 'message' ) )
            expect( actual.message ).to.equal( expected.message,
                `${location} has wrong validation message` )
        return endTime - startTime
    }

    it( 'should correctly check formula instantiations', () => {
        // Get all formula instantiation tests from the database
        const formulaTests = Database.filterByMetadata( metadata =>
            metadata.testing && metadata.testing.type &&
            metadata.testing.type == 'validation' &&
            metadata.testing.subtype &&
            metadata.testing.subtype == 'formula' )
        // they are all entitled "/path/filename N.smackdown" for some N,
        // so sort them by that value of N in increasing order.
        const getNum = key => {
            const parts = key.split( ' ' )
            return parseInt( parts.last().split( '.' )[0] )
        }
        formulaTests.sort( ( a, b ) => getNum( a ) - getNum( b ) )
        
        let clTime = 0
        let intTime = 0
        // Now run each test as follows...
        formulaTests.forEach( key => {
            // Look up the test with the given key and ensure it contains
            // more than one LogicConcept, the first being the "document" and
            // the rest being the instantiation blocks.
            const LCs = Database.getObjects( key )
            expect( LCs.length ).to.be.above( 1,
                `Malformed test: ${key} had only one LogicConcept in it` )
            let document = LCs[0]
            const instantiations = LCs.slice( 1 )
            // Process \[in]valid[{...}] commands
            expect(
                () => processValidityCommands( document ),
                `Processing \\[in]valid[{...}] commands in ${key}`
            ).not.to.throw()
            // Now we should be able to convert the document to an LC
            document = document.interpret()
            // Ensure the document passes a scoping check
            Scoping.validate( document, Scoping.declareInAncestor )
            expect(
                document.hasDescendantSatisfying(
                    d => !!Scoping.scopeErrors( d ) ),
                `Ensuring no scoping errors in document for ${key}`
            ).to.equal( false )
            // Process instantiation test blocks
            let instantiationTests = [ ]
            instantiations.forEach( ( MC, index ) => {
                expect(
                    () => instantiationTests.push(
                        parseInstantiation( MC.interpret() ) ),
                    `parsing instantiation #${index+1} in ${key}`
                ).not.to.throw()
            } )

            // Now run the instantiation tests in that test file
            instantiationTests.forEach( test => {
                // Ensure cited formula exists
                const original = descendantLabelLookup(
                    document, test.formula, null, `${test.formula} in ${key}`,
                    test.result, test.reason )
                if ( !original ) return
                const formula = Formula.from( original )
                // Ensure the correct set of metavariables was used
                const testDomain = new Set(
                    Object.getOwnPropertyNames( test.instantiation ) )
                const formulaDomain = Formula.domain( formula )
                // Could be the instantiation contains some non-metavars:
                const badNonMetaVars = testDomain.difference( formulaDomain )
                if ( badNonMetaVars.size > 0 )
                    return expectInvalidity(
                        `There were non-metavars ${test.formula} in ${key}`,
                        'not a metavariable: '
                            + Array.from( badNonMetaVars ).join( ',' ),
                        test.result, test.reason )
                // Could be the instantiation doesn't hit all the metavars:
                const missingMetaVars = formulaDomain.difference( testDomain )
                if ( missingMetaVars.size > 0 )
                    return expectInvalidity(
                        `There were missing metavars ${test.formula} in ${key}`,
                        'uninstantiated metavariable: '
                            + Array.from( missingMetaVars ).join( ',' ),
                        test.result, test.reason )
                // Could be the instantiation causes variable capture:
                const variableCapture = Array.from( testDomain ).some( mv =>
                    formula.descendantsSatisfying(
                        d => ( d instanceof LurchSymbol ) && d.text() == mv
                    ).some(
                        d => !test.instantiation[mv].isFreeToReplace( d, formula )
                    ) )
                if ( variableCapture )
                    return expectInvalidity(
                        `Variable capture ${test.formula} in ${key}`,
                        'variable capture',
                        test.result, test.reason )
                // All errors have been checked; this should succeed:
                let result
                expect(
                    () => result = Formula.instantiate(
                        formula, test.instantiation ),
                    `Doing the instantiation of ${test.formula} in ${key}`
                ).not.to.throw()
                // And the test should have expected that:
                expect( test.result ).to.equal( 'valid' )
                // Insert the instantiated version after the formula
                Formula.addCachedInstantiation( original, result )
            } )

            // Now run the validation tests in that file
            // What was marked valid/invalid, and thus needs validating?
            const arrayToValidate = document.descendantsSatisfying(
                d => d.hasAttribute( 'expected validation result' ) )
            // First, ensure all are conclusions
            arrayToValidate.forEach( toValidate => {
                // ensure it's a conclusion
                expect(
                    toValidate.isAConclusionIn( document ),
                    `Validating non-conclusion: ${key}@${toValidate.address()}`
                ).to.equal( true )
            } )
            // Run classical and intuitionistic validation on all
            Validation.setOptions( 'tool',
                'classical propositional logic on conclusions' )
            arrayToValidate.forEach( toValidate =>
                clTime += validateSequentFor( toValidate, key ) )
            Validation.setOptions( 'tool',
                'intuitionistic propositional logic on conclusions' )
            arrayToValidate.forEach( toValidate =>
                intTime += validateSequentFor( toValidate, key ) )
        } )
        // console.log( `INT / CL = ${intTime}ms / ${clTime}ms = `
        //            + Number( intTime / clTime ).toFixed( 2 ) )
    } )

    it( 'Should check blatant instantiation hints', () => {
        // Get all blatant instantiation tests from the database
        const blatantInstTests = Database.filterByMetadata( metadata =>
            metadata.testing && metadata.testing.type &&
            metadata.testing.type == 'validation' &&
            metadata.testing.subtype &&
            metadata.testing.subtype == 'blatant instantiation hint' )
        // they are all entitled "/path/filename N.smackdown" for some N,
        // so sort them by that value of N in increasing order.
        const getNum = key => {
            const parts = key.split( ' ' )
            return parseInt( parts.last().split( '.' )[0] )
        }
        blatantInstTests.sort( ( a, b ) => getNum( a ) - getNum( b ) )
        
        let clTime = 0
        let intTime = 0
        // Now run each test as follows...
        blatantInstTests.forEach( key => {
            // Look up the test with the given key and ensure it contains
            // exactly one LogicConcept, the "document."
            const LCs = Database.getObjects( key )
            expect( LCs ).to.have.length( 1,
                `Malformed test: ${key} should have one LogicConcept in it` )
            let document = LCs[0]
            // Process \[in]valid[{...}] commands
            expect(
                () => processValidityCommands( document ),
                `Processing \\[in]valid[{...}] commands in ${key}`
            ).not.to.throw()
            // Now we should be able to convert the document to an LC
            document = document.interpret()
            // Ensure the document passes a scoping check
            Scoping.validate( document, Scoping.declareInAncestor )
            expect(
                document.hasDescendantSatisfying(
                    d => !!Scoping.scopeErrors( d ) ),
                `Ensuring no scoping errors in document for ${key}`
            ).to.equal( false )

            // Process all blatant instantiation hints as follows:
            const BIHs = document.descendantsSatisfying(
                d => d.hasAttribute( 'ref' ) )
            BIHs.forEach( BIH => {
                // Fetch the expectations the database file gives
                const test = BIH.getAttribute( 'expected validation result' )
                const location = `In ${key} at ${BIH.address()}`

                // If there was no such thing, this test is incorrectly formed.
                expect(
                    test,
                    `${location}: incorrectly-formed blatant instantiation hint`
                ).to.be.ok

                // Does it cite a formula that is accessible to the BIH?  If not,
                // mark it invalid, and then check that it was indeed expected
                // to be \invalid{} in the test file.  This function includes
                // expectations taht the cited thing exists and is accessible.
                const cited = descendantLabelLookup(
                    document, BIH.getAttribute( 'ref' ), BIH,
                    location, test.result, test.reason )
                if ( !cited ) return

                // OK, the cited formula can be used, so let's prepare to do so
                // by making it a formula and normalizing attributes across
                // both the formula and the purported instantiation of it
                const formula = Formula.from( cited )
                Scoping.clearImplicitDeclarations( formula )
                formula.clearAttributes()
                const cleanBIH = BIH.copy()
                Scoping.clearImplicitDeclarations( cleanBIH )
                Array.from( cleanBIH.descendantsIterator() ).forEach( d =>
                    d.clearAttributes( 'ref', 'expected validation result' ) )
                cleanBIH.clearAttributes(
                    MathConcept.typeAttributeKey( 'given' ) )
                
                // Use the Formula.allPossibleInstantiations() function to
                // determine if the BIH is, indeed, an instantiation of the
                // cited formula, and mark it valid/invalid in response, then
                // the test suite should check that it was indeed marked
                // \valid{} or \invalid{} (resp.) in the test file.
                let correctInstantiation = false
                for ( let i of Formula.allPossibleInstantiations(
                        formula, cleanBIH ) ) {
                    correctInstantiation = true
                    break
                }
                if ( correctInstantiation ) {
                    expect( test.result ).to.equal( 'valid' )
                } else {
                    return expectInvalidity(
                        `${location}: invalid instantiation`,
                        'invalid instantiation',
                        test.result, test.reason )
                }
                
                // Since the BIH was valid, insert the clean copy of it after
                // the formula it instantiates.
                Formula.addCachedInstantiation( cited, cleanBIH )
            } )

            // Now all BIHs have been processed.
            // For each non-BIH marked with \[in]valid{} (which may include
            // conclusions inside of BIHs):
            const arrayToValidate = document.descendantsSatisfying(
                d => d.hasAttribute( 'expected validation result' )
                  && !d.hasAttribute( 'ref' )
            ).filter(
                toValidate => !BIHs.includes( toValidate )
            )
            // Ensure all of them are claims
            arrayToValidate.forEach( toValidate => {
                // Ensure that it’s a claim, and if not, throw an error that
                // the test file is incorrectly formed, because the only other
                // type of validation this test suite does is propositional,
                // which must be done on conclusions...but when we build a
                // sequent from the claim, any given ancestors won't be present
                // anyway, so claim status is sufficient.  (Especially since we
                // will want to validate claims inside BIHs, which will often
                // be flagged as givens in a test file.)
                expect(
                    toValidate.isA( 'given' ),
                    `${key}@${toValidate.address()} must be a claim`
                ).to.equal( false )
            } )
            // Run validation algorithm on each
            Validation.setOptions( 'tool',
                'classical propositional logic on conclusions' )
            arrayToValidate.forEach( toValidate =>
                clTime += validateSequentFor( toValidate, key ) )
            Validation.setOptions( 'tool',
                'intuitionistic propositional logic on conclusions' )
            arrayToValidate.forEach( toValidate =>
                intTime += validateSequentFor( toValidate, key ) )
        } )
        // console.log( `INT / CL = ${intTime}ms / ${clTime}ms = `
        //            + Number( intTime / clTime ).toFixed( 2 ) )
    } )

    // Utility function:  Run the validation algorithm on the sequent for a
    // given claim, and return the time the actual validation algorithm took,
    // but don't actually use expect(); just also return the validation result.
    const validateSequentWithoutExpectation = claim => {
        // Validate the conclusion propositionally and return the result without
        // bothering to do any comparisons, since this function is explicity
        // about NOT doing that.
        const sequent = new Validation.Sequent( claim )
        const startTime = new Date
        Validation.validate( sequent )
        // console.log( sequent.toPutdown() )
        const endTime = new Date
        return {
            time : endTime - startTime,
            result : Validation.result( sequent.conclusion() )
        }
    }

    it( 'Should pass weak instantiation hint tests from the database', () => {
        // Get all weak instantiation tests from the database
        const weakInstTests = Database.filterByMetadata( metadata =>
            metadata.testing && metadata.testing.type &&
            metadata.testing.type == 'validation' &&
            metadata.testing.subtype &&
            metadata.testing.subtype == 'weak instantiation hint' )
        // they are all entitled "/path/filename N.smackdown" for some N,
        // so sort them by that value of N in increasing order.
        const getNum = key => {
            const parts = key.split( ' ' )
            return parseInt( parts.last().split( '.' )[0] )
        }
        weakInstTests.sort( ( a, b ) => getNum( a ) - getNum( b ) )
        
        let clTime = 0
        let intTime = 0
        // Now run each test as follows...
        weakInstTests.forEach( key => {
            // Look up the test with the given key and ensure it contains
            // exactly one LogicConcept, the "document."
            const LCs = Database.getObjects( key )
            expect( LCs ).to.have.length( 1,
                `Malformed test: ${key} should have one LogicConcept in it` )
            let document = LCs[0]
            // Process \[in]valid[{...}] commands
            expect(
                () => processValidityCommands( document ),
                `Processing \\[in]valid[{...}] commands in ${key}`
            ).not.to.throw()
            // Now we should be able to convert the document to an LC
            document = document.interpret()
            // Ensure the document passes a scoping check
            Scoping.validate( document, Scoping.declareInAncestor )
            expect(
                document.hasDescendantSatisfying(
                    d => !!Scoping.scopeErrors( d ) ),
                `Ensuring no scoping errors in document for ${key}`
            ).to.equal( false )

            // Find all Weak Instantiation Hints and make sure they're
            // correctly formed:
            document.descendantsSatisfying(
                d => d.hasAttribute( 'ref' )
            ).forEach( WIH => {
                const location = `In ${key} at ${WIH.address()}`
                expect(
                    WIH.getAttribute( 'expected validation result' ),
                    `${location}: incorrectly-formed weak instantiation hint`
                ).to.be.ok
            } )

            // Now test them all classically:
            //
            // Compute a few data about the document that we will use below.
            // We will recompute these later when we do the same validation
            // intuitionistically, so we start with fresh copies of everything.
            Validation.setOptions( 'tool',
                'classical propositional logic on conclusions' )
            let docCopy = document.copy()
            let WIHs = docCopy.descendantsSatisfying(
                d => d.hasAttribute( 'ref' ) )
            // console.log( 'Before loop in '+key+':' )
            // console.log( docCopy.toPutdown() )
            WIHs.forEach( WIH => {
                // Fetch the expectations the database file gives
                const test = WIH.getAttribute( 'expected validation result' )
                const location = `In ${key} at ${WIH.address()}`
                // console.log( 'WIH @'+WIH.address()+':' )
                // console.log( WIH.toPutdown() )
                // console.log( JSON.stringify( test ) )

                // Is the WIH valid without even referring to the cited formula?
                // If so, give feedback saying as much.
                let temp = validateSequentWithoutExpectation( WIH )
                clTime += temp.time
                if ( temp.result.result == 'valid' ) {
                    expectValidity(
                        `${location}: extra \\ref{}`,
                        'formula citation unnecessary',
                        test.result, test.reason )
                    // console.log( 'Was valid alone!' )
                    // console.log( new Validation.Sequent( WIH ).toPutdown() )
                    return
                }

                // Does it cite a formula that is accessible to the WIH?  If not,
                // mark it invalid, and then check that it was indeed expected
                // to be \invalid{} in the test file.
                const cited = descendantLabelLookup(
                    docCopy, WIH.getAttribute( 'ref' ), WIH, location,
                    test.result, test.reason )
                if ( !cited ) return

                // OK, the cited formula can be used, so let's build a sequent,
                // ensure the formula is outside of it, convert it into a
                // formula, and clear all irrelevant attributes.
                const cleanWIH = WIH.copy()
                Scoping.clearImplicitDeclarations( cleanWIH )
                Array.from( cleanWIH.descendantsIterator() ).forEach( d =>
                    d.clearAttributes( 'ref', 'expected validation result' ) )
                cleanWIH.clearAttributes(
                    MathConcept.typeAttributeKey( 'given' ) )
                const sequent = new Validation.Sequent( WIH )
                const formula = Formula.from( cited )
                Array.from( formula.descendantsIterator() ).forEach( d =>
                    d.clearAttributes( 'ref', 'expected validation result' ) )
                formula.clearAttributes()

                // Use the Formula.possibleSufficientInstantiations() function
                // to try to find some instantiations of the WIH that will make
                // validation succeed for the sequent in question.
                // This test suite assumes the option direct = true.
                const generator = Formula.possibleSufficientInstantiations(
                    sequent, formula, { direct : true } )
                let goodInstantiation = null
                // let count = 0
                for ( const solution of generator ) {
                    const instantiation = Formula.instantiate(
                        formula, solution.solution )
                    sequent.insertChild( instantiation, 0 )
                    temp = validateSequentWithoutExpectation( 
                        sequent.conclusion() )
                    clTime += temp.time
                    if ( temp.result.result == 'valid' )
                        goodInstantiation = instantiation
                    // cleanup and possibly stop
                    sequent.removeChild( 0 )
                    if ( goodInstantiation ) break
                }
                if ( goodInstantiation == null ) {
                    // console.log( 'No good instantiations:' )
                    // console.log( sequent.toPutdown() )
                    // console.log( formula.toPutdown() )
                    return expectInvalidity(
                        `${location}: invalid step`,
                        undefined, test.result, test.reason )
                }
                expectValidity(
                    `${location}: valid step`,
                    undefined, test.result, test.reason )
                // Since the WIH was valid, insert the good instantiation we
                // found after the cited formula.
                Formula.addCachedInstantiation( cited, goodInstantiation )
                // console.log( 'Added @'+cited.address(), docCopy.toPutdown() )
                // console.log( `Made me add ${goodInstantiation.toPutdown()}` )
            } )

            // Now all WIHs have been processed classically.
            // Now find each thing marked with \[in]valid{} but that has not yet
            // been validated, so we can validate them.
            docCopy.descendantsSatisfying(
                d => d.hasAttribute( 'expected validation result' )
                  && !d.hasAttribute( 'validation result' )
            ).forEach( toValidate => {
                // Ensure that it’s a claim, and if not, throw an error that
                // the test file is incorrectly formed, because the only other
                // type of validation this test suite does is propositional,
                // which must be done on conclusions...but when we build a
                // sequent from the claim, any given ancestors won't be present
                // anyway, so claim status is sufficient.
                expect(
                    toValidate.isA( 'given' ),
                    `${key}@${toValidate.address()} must be a claim`
                ).to.equal( false )
                // OK now validate it
                clTime += validateSequentFor( toValidate, key )
            } )

            // Now test them all intuitionistically as well:
            //
            // Recompute the same things we did earlier, so we have a fresh
            // copy of the document and aren't re-using stuff done with CPL:
            Validation.setOptions( 'tool',
                'intuitionistic propositional logic on conclusions' )
            docCopy = document.copy()
            WIHs = docCopy.descendantsSatisfying(
                d => d.hasAttribute( 'ref' ) )
            // console.log( 'Before loop in '+key+':' )
            // console.log( docCopy.toPutdown() )
            WIHs.forEach( WIH => {
                // Fetch the expectations the database file gives
                const test = WIH.getAttribute( 'expected validation result' )
                const location = `In ${key} at ${WIH.address()}`
                // console.log( 'WIH @'+WIH.address()+':' )
                // console.log( WIH.toPutdown() )
                // console.log( JSON.stringify( test ) )

                // Is the WIH valid without even referring to the cited formula?
                // If so, give feedback saying as much.
                let temp = validateSequentWithoutExpectation( WIH )
                intTime += temp.time
                if ( temp.result.result == 'valid' ) {
                    expectValidity(
                        `${location}: extra \\ref{}`,
                        'formula citation unnecessary',
                        test.result, test.reason )
                    // console.log( 'Was valid alone!' )
                    // console.log( new Validation.Sequent( WIH ).toPutdown() )
                    return
                }

                // Does it cite a formula that is accessible to the WIH?  If not,
                // mark it invalid, and then check that it was indeed expected
                // to be \invalid{} in the test file.
                const cited = descendantLabelLookup(
                    docCopy, WIH.getAttribute( 'ref' ), WIH, location,
                    test.result, test.reason )
                if ( !cited ) return

                // OK, the cited formula can be used, so let's build a sequent,
                // ensure the formula is outside of it, convert it into a
                // formula, and get some candidate instantiations to test.
                // Clear all irrelevant attributes.
                // This test suite assumes the option direct = true.
                const cleanWIH = WIH.copy()
                Scoping.clearImplicitDeclarations( cleanWIH )
                Array.from( cleanWIH.descendantsIterator() ).forEach( d =>
                    d.clearAttributes( 'ref', 'expected validation result' ) )
                cleanWIH.clearAttributes(
                    MathConcept.typeAttributeKey( 'given' ) )
                const sequent = new Validation.Sequent( WIH )
                const formula = Formula.from( cited )
                Array.from( formula.descendantsIterator() ).forEach( d =>
                    d.clearAttributes( 'ref', 'expected validation result' ) )
                formula.clearAttributes()
                
                // Use the Formula.possibleSufficientInstantiations() function
                // to try to find some instantiations of the WIH that will make
                // validation succeed for the sequent in question.
                const generator = Formula.possibleSufficientInstantiations(
                    sequent, formula, { direct : true } )
                let goodInstantiation = null
                // let count = 0
                for ( const solution of generator ) {
                    const instantiation = Formula.instantiate(
                        formula, solution.solution )
                    sequent.insertChild( instantiation, 0 )
                    temp = validateSequentWithoutExpectation( 
                        sequent.conclusion() )
                    intTime += temp.time
                    if ( temp.result.result == 'valid' )
                        goodInstantiation = instantiation
                    // cleanup and possibly stop
                    sequent.removeChild( 0 )
                    if ( goodInstantiation ) break
                }
                if ( goodInstantiation == null ) {
                    // console.log( 'No good instantiations:' )
                    // console.log( sequent.toPutdown() )
                    // console.log( formula.toPutdown() )
                    return expectInvalidity(
                        `${location}: invalid step`,
                        undefined, test.result, test.reason )
                }
                expectValidity(
                    `${location}: valid step`,
                    undefined, test.result, test.reason )
                // Since the WIH was valid, insert the good instantiation we
                // found after the cited formula.
                Formula.addCachedInstantiation( cited, goodInstantiation )
                // console.log( 'Added @'+cited.address(), docCopy.toPutdown() )
                // console.log( `Made me add ${goodInstantiation.toPutdown()}` )
            } )

            // Now all WIHs have been processed classically.
            // Now find each thing marked with \[in]valid{} but that has not yet
            // been validated, so we can validate them.
            docCopy.descendantsSatisfying(
                d => d.hasAttribute( 'expected validation result' )
                  && !d.hasAttribute( 'validation result' )
            ).forEach( toValidate => {
                // Ensure that it’s a claim, and if not, throw an error that
                // the test file is incorrectly formed, because the only other
                // type of validation this test suite does is propositional,
                // which must be done on conclusions...but when we build a
                // sequent from the claim, any given ancestors won't be present
                // anyway, so claim status is sufficient.
                expect(
                    toValidate.isA( 'given' ),
                    `${key}@${toValidate.address()} must be a claim`
                ).to.equal( false )
                // OK now validate it:
                intTime += validateSequentFor( toValidate, key )
            } )
        } )
        // console.log( `INT / CL = ${intTime}ms / ${clTime}ms = `
        //            + Number( intTime / clTime ).toFixed( 2 ) )
    } )

    it( 'Should pass strong instantiation hint tests from the database', () => {
        // Get all strong instantiation tests from the database
        const strongInstTests = Database.filterByMetadata( metadata =>
            metadata.testing && metadata.testing.type &&
            metadata.testing.type == 'validation' &&
            metadata.testing.subtype &&
            metadata.testing.subtype == 'strong instantiation hint' )
        // they are all entitled "/path/filename N.smackdown" for some N,
        // so sort them by that value of N in increasing order.
        const getNum = key => {
            const parts = key.split( ' ' )
            return parseInt( parts.last().split( '.' )[0] )
        }
        strongInstTests.sort( ( a, b ) => getNum( a ) - getNum( b ) )

        let clTime = 0
        let intTime = 0
        let totClTime = 0
        let totIntTime = 0
        // Now run each test as follows...
        strongInstTests.forEach( key => {
            // Look up the test with the given key and ensure it contains
            // exactly one LogicConcept, the "document."
            const LCs = Database.getObjects( key )
            expect( LCs ).to.have.length( 1,
                `Malformed test: ${key} should have one LogicConcept in it` )
            let document = LCs[0]
            // Process \[in]valid[{...}] commands
            expect(
                () => processValidityCommands( document ),
                `Processing \\[in]valid[{...}] commands in ${key}`
            ).not.to.throw()
            // Now we should be able to convert the document to an LC
            document = document.interpret()
            // Ensure the document passes a scoping check
            Scoping.validate( document, Scoping.declareInAncestor )
            expect(
                document.hasDescendantSatisfying(
                    d => !!Scoping.scopeErrors( d ) ),
                `Ensuring no scoping errors in document for ${key}`
            ).to.equal( false )

            // Now test all strong instantiation hints classically:
            //
            // Compute a few data about the document that we will use below.
            // We will recompute these later when we do the same validation
            // intuitionistically, so we start with fresh copies of everything.
            let fileStartTime = new Date
            Validation.setOptions( 'tool',
                'classical propositional logic on conclusions' )
            let docCopy = document.copy()
            let SIHs = docCopy.descendantsSatisfying(
                d => d.hasAttribute( 'expected validation result' ) )
            // console.log( 'Before loop in '+key+':' )
            // console.log( docCopy.toPutdown() )
            SIHs.forEach( SIH => {
                // Fetch the expectations the database file gives
                const test = SIH.getAttribute( 'expected validation result' )
                const location = `In ${key} at ${SIH.address()}`
                // console.log( 'SIH @'+SIH.address()+':' )
                // console.log( SIH.toPutdown() )
                // console.log( JSON.stringify( test ) )
                
                // Is the SIH valid without even referring to the cited formula?
                // If so, give feedback saying as much.
                let temp = validateSequentWithoutExpectation( SIH )
                clTime += temp.time
                if ( temp.result.result == 'valid' ) {
                    expectValidity(
                        `${location}: extra \\ref{}`,
                        'formula citation unnecessary',
                        test.result, test.reason )
                    // console.log( 'Was valid alone!' )
                    // console.log( new Validation.Sequent( SIH ).toPutdown() )
                    return
                }

                // Build a sequent and then let's walk through all of its
                // premises and see which ones can be tried as a formula:
                const cleanSIH = SIH.copy()
                Scoping.clearImplicitDeclarations( cleanSIH )
                Array.from( cleanSIH.descendantsIterator() ).forEach( d =>
                    d.clearAttributes( 'ref', 'expected validation result' ) )
                cleanSIH.clearAttributes(
                    MathConcept.typeAttributeKey( 'given' ) )
                const sequent = new Validation.Sequent( SIH )
                let sequentWasValid = false
                sequent.premises().forEach( ( premise, premIndex ) => {
                    // should we break out of this loop?
                    if ( sequentWasValid ) return

                    // can this even be a formula?
                    if ( !( premise instanceof Environment ) ) return

                    // make a copy of the sequent without the given premise
                    const smallerSequent = sequent.copy()
                    smallerSequent.child( premIndex ).remove()
                    // sanitize the copied premise for use as a formula
                    const origPrem = sequent.originalPremises()[premIndex]
                    const formula = Formula.from( origPrem )
                    Array.from( formula.descendantsIterator() ).forEach( d =>
                        d.clearAttributes( 'ref', 'expected validation result' ) )
                    formula.clearAttributes()

                    // Use the Formula.possibleSufficientInstantiations()
                    // function to try to find some instantiations of the SIH
                    // that will make validation succeed for the sequent in
                    // question.  This test suite assumes the option
                    // direct = true.
                    const generator = Formula.possibleSufficientInstantiations(
                        smallerSequent, formula, { direct : true } )
                    let goodInstantiation = null
                    // let count = 0
                    for ( const solution of generator ) {
                        const instantiation = Formula.instantiate(
                            formula, solution.solution )
                        smallerSequent.insertChild( instantiation, 0 )
                        temp = validateSequentWithoutExpectation( 
                            smallerSequent.conclusion() )
                        clTime += temp.time
                        if ( temp.result.result == 'valid' )
                            goodInstantiation = instantiation
                        // cleanup and possibly stop
                        smallerSequent.removeChild( 0 )
                        if ( goodInstantiation ) break
                    }
                    if ( goodInstantiation ) {
                        // console.log( `------------------------------\n${key}` )
                        // console.log( `Sequent: ${smallerSequent.toPutdown()}` )
                        // console.log( `Formula: ${formula.toPutdown()}` )
                        // console.log( `Instantiation: ${goodInstantiation.toPutdown()}` )
    
                        sequentWasValid = true
                        expectValidity(
                            `${location} (${SIH.toPutdown()}): valid step`,
                            undefined, test.result, test.reason )
                        // Since the SIH was valid, insert the good instantiation we
                        // found after the cited formula.
                        // console.log( 'Added @'+cited.address(), docCopy.toPutdown() )
                        // console.log( `Made me add ${goodInstantiation.toPutdown()}` )
                        Formula.addCachedInstantiation( premise,
                            goodInstantiation )
                    }
                } )

                if ( !sequentWasValid ) {
                    // console.log( 'No good instantiations:' )
                    // console.log( sequent.toPutdown() )
                    return expectInvalidity(
                        `${location} (${SIH.toPutdown()}): invalid step`,
                        undefined, test.result, test.reason )
                }
            } )
            let fileEndTime = new Date
            let fileElapsed = fileEndTime - fileStartTime
            totClTime += fileElapsed
            // console.log( `CPL on ${key} took ${fileElapsed}ms` )

            // Now test all strong instantiation hints classically:
            //
            // Compute a few data about the document that we will use below.
            // We will recompute these later when we do the same validation
            // intuitionistically, so we start with fresh copies of everything.
            fileStartTime = new Date
            Validation.setOptions( 'tool',
                'intuitionistic propositional logic on conclusions' )
            docCopy = document.copy()
            SIHs = docCopy.descendantsSatisfying(
                d => d.hasAttribute( 'expected validation result' ) )
            // console.log( 'Before loop in '+key+':' )
            // console.log( docCopy.toPutdown() )
            SIHs.forEach( SIH => {
                // Fetch the expectations the database file gives
                const test = SIH.getAttribute( 'expected validation result' )
                const location = `In ${key} at ${SIH.address()}`
                // console.log( 'SIH @'+SIH.address()+':' )
                // console.log( SIH.toPutdown() )
                // console.log( JSON.stringify( test ) )
                
                // Is the SIH valid without even referring to any cited formula?
                // If so, give feedback saying as much.
                let temp = validateSequentWithoutExpectation( SIH )
                intTime += temp.time
                if ( temp.result.result == 'valid' ) {
                    expectValidity(
                        `${location}: extra \\ref{}`,
                        'formula citation unnecessary',
                        test.result, test.reason )
                    // console.log( 'Was valid alone!' )
                    // console.log( new Validation.Sequent( SIH ).toPutdown() )
                    return
                }

                // Build a sequent and then let's walk through all of its
                // premises and see which ones can be tried as a formula:
                const cleanSIH = SIH.copy()
                Scoping.clearImplicitDeclarations( cleanSIH )
                Array.from( cleanSIH.descendantsIterator() ).forEach( d =>
                    d.clearAttributes( 'ref', 'expected validation result' ) )
                cleanSIH.clearAttributes(
                    MathConcept.typeAttributeKey( 'given' ) )
                const sequent = new Validation.Sequent( SIH )
                let sequentWasValid = false
                sequent.premises().forEach( ( premise, premIndex ) => {
                    // should we break out of this loop?
                    if ( sequentWasValid ) return

                    // can this even be a formula?
                    if ( !( premise instanceof Environment ) ) return

                    // make a copy of the sequent without the given premise
                    const smallerSequent = sequent.copy()
                    smallerSequent.child( premIndex ).remove()
                    // sanitize the copied premise for use as a formula
                    const origPrem = sequent.originalPremises()[premIndex]
                    const formula = Formula.from( origPrem )
                    Array.from( formula.descendantsIterator() ).forEach( d =>
                        d.clearAttributes( 'ref', 'expected validation result' ) )
                    formula.clearAttributes()

                    // Use the Formula.possibleSufficientInstantiations()
                    // function to try to find some instantiations of the SIH
                    // that will make validation succeed for the sequent in
                    // question.  This test suite assumes the option
                    // direct = true.
                    const generator = Formula.possibleSufficientInstantiations(
                        smallerSequent, formula, { direct : true } )
                    let goodInstantiation = null
                    // let count = 0
                    for ( const solution of generator ) {
                        const instantiation = Formula.instantiate(
                            formula, solution.solution )
                        smallerSequent.insertChild( instantiation, 0 )
                        temp = validateSequentWithoutExpectation( 
                            smallerSequent.conclusion() )
                        intTime += temp.time
                        if ( temp.result.result == 'valid' )
                            goodInstantiation = instantiation
                        // cleanup and possibly stop
                        smallerSequent.removeChild( 0 )
                        if ( goodInstantiation ) break
                    }
                    if ( goodInstantiation ) {
                        // console.log( `------------------------------\n${key}` )
                        // console.log( `Sequent: ${smallerSequent.toPutdown()}` )
                        // console.log( `Formula: ${formula.toPutdown()}` )
                        // console.log( `Instantiation: ${goodInstantiation.toPutdown()}` )
    
                        sequentWasValid = true
                        expectValidity(
                            `${location} (${SIH.toPutdown()}): valid step`,
                            undefined, test.result, test.reason )
                        // Since the SIH was valid, insert the good instantiation we
                        // found after the cited formula.
                        // console.log( 'Added @'+cited.address(), docCopy.toPutdown() )
                        // console.log( `Made me add ${goodInstantiation.toPutdown()}` )
                        Formula.addCachedInstantiation( premise,
                            goodInstantiation )
                    }
                } )

                if ( !sequentWasValid ) {
                    // console.log( 'No good instantiations:' )
                    // console.log( sequent.toPutdown() )
                    return expectInvalidity(
                        `${location} (${SIH.toPutdown()}): invalid step`,
                        undefined, test.result, test.reason )
                }
            } )
            fileEndTime = new Date
            fileElapsed = fileEndTime - fileStartTime
            totIntTime += fileElapsed
            // console.log( `IPL on ${key} took ${fileElapsed}ms` )
        } )
        // console.log( `Validation: INT / CL = ${intTime}ms / ${clTime}ms = `
        //            + Number( intTime / clTime ).toFixed( 2 ) )
        // console.log( `Val + Mtch: INT / CL = ${totIntTime}ms / ${totClTime}ms = `
        //            + Number( totIntTime / totClTime ).toFixed( 2 ) )
    } )

    it( 'Should do modifications that enable an instantiation loop', () => {
        // create a simple document that can be fully validated only through
        // multiple passes (since earlier things depend on later things):
        const document = LogicConcept.fromPutdown( `
            (∧ ∨ ⇒ ⇔ ¬ ∀ ∃ =) , {
                // rules:
                :{ :X (∨ X Y) (∨ Y X) }  // ∨+ rule
                :{ :X :Y (∧ X Y) }       // ∧+ rule

                // one solitary premise to give us something to reason with:
                :P

                // conclusions:
                (∧ (∨ P Q) (∨ Q P))      // This is true because...
                (∨ P Q)                  // ...of this...
                (∨ Q P)                  // ...and this.
            }
        ` )[0]
        const concl1 = document.child( 8, 3 ) // (∧ (∨ P Q) (∨ Q P))
        const concl2 = document.child( 8, 4 ) // (∨ P Q)
        const concl3 = document.child( 8, 5 ) // (∨ Q P)
        // now prepare a function that does a pass of the document, trying to
        // validate all conclusions by seeking formulas that may justify them:
        const doOnePass = () => {
            document.body().conclusions().forEach( conclusion => {
                // Is the conclusion already marked valid?  If so, do nothing.
                if ( Validation.result( conclusion )
                  && Validation.result( conclusion ).result == 'valid' ) {
                    const tmp = conclusion.copy()
                    Validation.clearResult( tmp )
                    // console.log( 'Not re-validating this:', tmp.toPutdown() )
                    return
                }
                // console.log( 'Validating:', conclusion.toPutdown() )
                // Is the conclusion valid without using any formula?
                // If so, we are done already!
                Validation.validate( conclusion )
                let temp = Validation.result( conclusion )
                if ( temp.result == 'valid' ) {
                    const tmp = conclusion.copy()
                    Validation.clearResult( tmp )
                    // console.log( 'Valid without instantiation:', tmp.toPutdown() )
                    return
                }
                // Okay, consider each environment accessible to the conclusion
                // as a possibility for a formula that justifies it:
                let done = false
                conclusion.accessibles().forEach( accessible => {
                    if ( done ) return
                    if ( !( accessible instanceof Environment ) ) return
                    // console.log( 'Trying formula:', accessible.toPutdown() )
                    const formula = Formula.from( accessible )
                    formula.clearAttributes()
                    const parent = accessible.parent()
                    const insertionPoint = accessible.indexInParent() + 1
                    const generator = Formula.possibleSufficientInstantiations(
                        new Validation.Sequent( conclusion ), formula,
                        { direct : true } )
                    for ( const solution of generator ) {
                        const instantiation = Formula.instantiate(
                            formula, solution.solution ).asA( 'given' )
                        // console.log( 'Trying instantiation:',
                        //     instantiation.toPutdown() )
                        parent.insertChild( instantiation, insertionPoint )
                        Validation.validate( conclusion )
                        // console.log( document.toPutdown() )
                        if ( Validation.result( conclusion ).result == 'valid' ) {
                            done = true
                            break
                        } else {
                            parent.child( insertionPoint ).remove()
                        }
                    }
                    // if ( !done ) console.log( 'No instantiation worked.' )
                } )
                const result = Validation.result( conclusion )
                if ( result.result != 'valid' )
                    Validation.setResult( conclusion, {
                        result : 'invalid',
                        reason : 'No formula makes this valid',
                        method : result.reason
                    } )
            } )
        }
        // run the first pass over the document.  we should find that the last
        // two conclusions are both valid, but the first conclusion is not.
        // console.log( 'Current state of document:', document.toPutdown() )
        // console.log( 'PASS #1 STARTS HERE.' )
        Validation.setOptions( 'tool',
            'classical propositional logic on conclusions' )
        expect( doOnePass ).not.to.throw()
        expect( Validation.result( concl1 ) ).to.eql( {
            result : 'invalid',
            reason : 'No formula makes this valid',
            method : 'Classical Propositional Logic'
        } )
        expect( Validation.result( concl2 ) ).to.eql( {
            result : 'valid',
            reason : 'Classical Propositional Logic'
        } )
        expect( Validation.result( concl3 ) ).to.eql( {
            result : 'valid',
            reason : 'Classical Propositional Logic'
        } )
        // run the second pass over the document.  we should find that all
        // three conclusions are valid.
        // console.log( 'Current state of document:', document.toPutdown() )
        // console.log( 'PASS #2 STARTS HERE.' )
        expect( doOnePass ).not.to.throw()
        expect( Validation.result( concl1 ) ).to.eql( {
            result : 'valid',
            reason : 'Classical Propositional Logic'
        } )
        expect( Validation.result( concl2 ) ).to.eql( {
            result : 'valid',
            reason : 'Classical Propositional Logic'
        } )
        expect( Validation.result( concl3 ) ).to.eql( {
            result : 'valid',
            reason : 'Classical Propositional Logic'
        } )
        // console.log( 'Current state of document:', document.toPutdown() )
    } )

} )
