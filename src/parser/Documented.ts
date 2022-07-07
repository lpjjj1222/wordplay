import Expression from "./Expression";
import type { Token } from "./Token";

export default class Documented extends Expression {
    
    readonly tick: Token;
    readonly expression: Expression;

    constructor(tick: Token, expression: Expression) {
        super();
        this.tick = tick;
        this.expression = expression;
    }

    getChildren() { return [ this.tick, this.expression ]; }

}