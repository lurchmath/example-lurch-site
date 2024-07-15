
import { MathConcept } from './math-concept.js'
import { LogicConcept } from './logic-concept.js'
import { Expression } from './expression.js'
import { Declaration } from './declaration.js'

/**
 * An Environment in Lurch is a wrapper that can enclose any sequence of
 * {@link LogicConcept LogicConcepts}, which is useful for many purposes,
 * including the following.
 * 
 *  * Nesting subproofs within a proof so that it is clear where assumptions
 *    and variable declarations are (and are not) in force.  (This is what we
 *    anticipate as the most common use.)
 *  * Marking the boundaries of theorems, proofs, definitions, axioms, and
 *    other important structures that form a single, cohesive unit.
 *  * Delimiting exercises in a text from the rest of the text, so that
 *    variables declared in those exercises do not remain in scope for the
 *    rest of the text.
 * 
 * This class inherits its constructor from its parent class; to create an
 * environment wrapping a sequence `L_1` through `L_n` of
 * {@link LogicConcept LogicConcepts}, just call
 * `new Environment( L1, ..., Ln )`.  Such an environment does not, by default,
 * declare or bind any new symbols.  But you can create an instance of the
 * {@link BindingEnvironment Binding Environment subclass} to do so; it is
 * useful, for example, when constructing subproofs that begin by declaring
 * some symbol arbitrary.  See its documentation for further details.
 */
export class Environment extends LogicConcept {
    
    static className = MathConcept.addSubclass( 'Environment', Environment )

    /**
     * Any {@link LogicConcept} can be marked as a "given," meaning that it is
     * to be seen as a hypothesis/assumption within its context.  Any
     * {@link LogicConcept} not so marked is viewed as a "claim," meaning that
     * it is an assertion/statement of truth, within its context.  For this,
     * we use the attribute functions built into the {@link MathConcept}
     * class, including {@link MathConcept#isA isA()},
     * {@link MathConcept#asA asA()}, and so on.
     * 
     * The conclusions of a LogicConcept include:
     * 
     *  * all of its children that are claim {@link Expression Expressions}
     *  * all of the conclusions in any of its child Environments that are
     *    themselves claims, recursively
     * 
     * Thus conclusions are always {@link Expression Expressions} or
     * {@link Declaration Declarations}, never other Environments.  And for
     * each one, all the members of its ancestor chain, up to but not
     * necessarily including the Environment in which this method was called,
     * will be claims, not givens.
     */
    conclusions () {
        let result = [ ]
        this.children().forEach( child => {
            if ( child.isA( 'given' ) ) return
            if ( child instanceof Expression || child instanceof Declaration )
                result.push( child ) // guaranteed to be outermost expr/decl
            else if ( child instanceof Environment )
                result = result.concat( child.conclusions() )
        } )
        return result
    }

}
