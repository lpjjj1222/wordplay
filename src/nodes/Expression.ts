import Node from './Node';
import type Context from './Context';
import type Evaluator from '../runtime/Evaluator';
import type Value from 'src/runtime/Value';
import type Type from './Type';
import type Step from 'src/runtime/Step';
import type Bind from './Bind';
import type TypeSet from './TypeSet';
import type Stream from '../runtime/Stream';
import type Translation from '../translations/Translation';
import type { Description } from '../translations/Translation';

export default abstract class Expression extends Node {
    constructor() {
        super();
    }

    /**
     * True if the expression is involved in triggering an evaluation. Used to decide whether to present
     * as code or value during stepping.
     */
    isEvaluationInvolved() {
        return false;
    }
    isEvaluationRoot() {
        return false;
    }

    /** True if binary operations can be applied to this without wrapping it in parentheses */

    abstract computeType(context: Context): Type;

    getType(context: Context): Type {
        return context.getType(this);
    }

    abstract getDependencies(_: Context): (Expression | Stream<Value>)[];

    /**
     * Used to determine what types are possible for a given after evalutaing this expression/
     * Most expressions do not manipulate possible types at all; primarily is just logical operators and type checks.
     * */
    abstract evaluateTypeSet(
        bind: Bind,
        original: TypeSet,
        current: TypeSet,
        context: Context
    ): TypeSet;

    abstract compile(context: Context): Step[];
    abstract evaluate(evaluator: Evaluator, prior: Value | undefined): Value;

    abstract getStart(): Node;
    abstract getFinish(): Node;

    abstract getStartExplanations(
        translation: Translation,
        context: Context
    ): Description;
    abstract getFinishExplanations(
        translation: Translation,
        context: Context
    ): Description;
}
