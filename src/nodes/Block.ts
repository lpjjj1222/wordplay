import type Node from "./Node";
import Bind from "./Bind";
import type Conflict from "../conflicts/Conflict";
import { ExpectedEndingExpression } from "../conflicts/ExpectedEndingExpression";
import { IgnoredExpression } from "../conflicts/IgnoredExpression";
import Expression from "./Expression";
import Token from "./Token";
import type Type from "./Type";
import UnknownType from "./UnknownType";
import type Evaluator from "../runtime/Evaluator";
import Start from "../runtime/Start";
import Finish from "../runtime/Finish";
import type Step from "../runtime/Step";
import Halt from "../runtime/Halt";
import type Context from "./Context";
import type Definition from "./Definition";
import StructureDefinition from "./StructureDefinition";
import FunctionDefinition from "./FunctionDefinition";
import type { TypeSet } from "./UnionType";
import ValueException from "../runtime/ValueException";
import None from "../runtime/None";
import ConversionDefinition from "./ConversionDefinition";
import { getExpressionInsertions, getExpressionReplacements, getPossiblePostfix } from "../transforms/getPossibleExpressions";
import ExpressionPlaceholder from "./ExpressionPlaceholder";
import Name from "./Name";
import type Transform from "../transforms/Transform"
import Replace from "../transforms/Replace";
import Append from "../transforms/Append";
import Remove from "../transforms/Remove";
import type Translations from "./Translations";
import { TRANSLATE } from "./Translations"
import Docs from "./Docs";
import Names from "./Names";
import type Value from "../runtime/Value";
import EvalCloseToken from "./EvalCloseToken";
import EvalOpenToken from "./EvalOpenToken";
import UnclosedDelimiter from "../conflicts/UnclosedDelimiter";

export default class Block extends Expression {

    readonly docs?: Docs;
    readonly open?: Token;
    readonly statements: Expression[];
    readonly close?: Token;

    readonly root: boolean;
    readonly creator: boolean;

    constructor(statements: Expression[], root: boolean, creator: boolean, open?: Token, close?: Token, docs?: Docs) {
        super();

        this.open = open;
        this.statements = statements;
        this.close = close;
        this.docs = docs === undefined ? undefined : docs instanceof Docs ? docs : new Docs(docs);
        this.root = root;
        this.creator = creator;

        this.computeChildren();

    }

    static make(statements: Expression[]) {
        return new Block(statements, false, false, new EvalOpenToken(), new EvalCloseToken());
    }

    getGrammar() { 
        return [
            { name: "docs", types:[ Docs, undefined ] },
            { name: "open", types:[ Token, undefined ] },
            { name: "statements", types:[[ Expression, Bind ]] },
            { name: "close", types:[ Token, undefined ] },
        ];
    }

    getPreferredPrecedingSpace(child: Node, space: "", depth: number): string {
        // If the child has a new line, indent it.
        const childIndex = this.statements.indexOf(child as Expression);
        return childIndex >= 0 && space.indexOf("\n") >= 0 ? `${"\t".repeat(depth)}` : "";
    }

    isBlockFor(child: Node) { return !this.root && this.statements.includes(child as Expression); }

    replace(original?: Node, replacement?: Node) { 
        return new Block(
            this.replaceChild<Expression[]>("statements", this.statements, original, replacement),
            this.root,
            this.creator, 
            this.replaceChild("open", this.open, original, replacement), 
            this.replaceChild("close", this.close, original, replacement),
            this.replaceChild("docs", this.docs, original, replacement),
        ) as this; 
    }

    getLast() { return this.statements.length === 0 ? undefined : this.statements[this.statements.length - 1]; }

    isEvaluationInvolved() { return true; }
    isBindingEnclosureOfChild(): boolean { return true; }

    computeConflicts(): Conflict[] {

        const conflicts = [];

        // Blocks can't be empty. And if they aren't empty, the last statement must be an expression.
        if(!this.root && !this.creator && (this.statements.length === 0 || !(this.statements[this.statements.length  - 1] instanceof Expression)))
            conflicts.push(new ExpectedEndingExpression(this));

        // The only expression allowed is the last one.
        this.statements
            .slice(0, this.statements.length - 1)
            .filter(s => (s instanceof Expression && !(s instanceof StructureDefinition || s instanceof FunctionDefinition || s instanceof ConversionDefinition || s instanceof Bind)))
            .forEach(s => conflicts.push(new IgnoredExpression(s as Expression)));

        if(this.open && this.close === undefined)
            conflicts.push(new UnclosedDelimiter(this, this.open, new EvalCloseToken()));

        return conflicts;
        
    }

    getStatementIndexContaining(node: Node): number | undefined {

        const containingStatement = this.statements.find(s => s.contains(node));
        if(containingStatement === undefined) return;
        const index = this.statements.indexOf(containingStatement);
        if(index < 0) return;
        return index;

    }

    getDefinitions(node: Node, context: Context): Definition[] {

        const index = this.getStatementIndexContaining(node);
        if(index === undefined) return [];

        // Do any of the binds, structure, or function definitions declare it?
        return [
            // Expose all the binds in the block
            // Note that we allow an bind to refer to itself, since bound reactions can refer to themselves.
            ...(this.statements.filter((s, i): s is Bind  => i <= index && s instanceof Bind)),
            // Expose all of the FunctionDefinition and StructureDefinition for which this is the binding enclosure
            ...(this.nodes().filter((n): n is FunctionDefinition | StructureDefinition => 
            (n instanceof FunctionDefinition || n instanceof StructureDefinition ) && context.get(n)?.getBindingScope() === this))
         ];
        
    }
 
    computeType(context: Context): Type {
        // The type of the last expression.
        const lastExpression = this.statements.slice().reverse().find(s => s instanceof Expression) as Expression | undefined;
        return lastExpression === undefined ? new UnknownType(this) : lastExpression.getTypeUnlessCycle(context);
    }

    getDependencies(context: Context): Expression[] {

        const parent = context.get(this)?.getParent();

        // If the block is in a structure definition, then it depends on the parent's inputs
        if(this.creator && parent instanceof StructureDefinition)
            return [ ...parent.inputs ];

        // Otherwise, a block's value depends on it's last statement.
        const lastStatement = this.statements[this.statements.length - 1];
        return lastStatement === undefined ? [] : [ lastStatement ];

    }

    compile(context: Context):Step[] {

        // If there are no statements, halt on exception.
        return !this.creator && this.statements.length === 0 ? 
            [ new Halt(evaluator => new ValueException(evaluator), this) ] :
            [ 
                new Start(this), 
                ...this.statements.reduce((prev: Step[], current) => [ ...prev, ...current.compile(context) ], []),
                new Finish(this) 
            ];

    }

    evaluate(evaluator: Evaluator, prior: Value | undefined): Value {
        
        if(prior) 
            return prior;

        // Root blocks are allowed to have no value, but all others must have one.
        return (this.creator || this.root) && !evaluator.hasValue() ? new None(this) : evaluator.popValue(undefined);

    }

    /** 
     * Blocks don't do any type checks, but we do have them delegate type checks to their final expression.
     * since we use them for parentheticals in boolean logic.
     * */
    evaluateTypeSet(bind: Bind, original: TypeSet, current: TypeSet, context: Context) { 

        if(this.statements.length === 0) return current;
        const last = this.statements[this.statements.length - 1];
        return last instanceof Expression ? last.evaluateTypeSet(bind, original, current, context) : current;

    }

    getInsertions() {
        const bind = Bind.make(undefined, new Names([ Name.make() ]), undefined, new ExpressionPlaceholder());
        const type = FunctionDefinition.make(undefined, new Names([ Name.make() ]), undefined, [], new ExpressionPlaceholder());
        const fun = StructureDefinition.make(undefined, new Names([ Name.make() ]), [], undefined, []);
        return [ 
            bind, 
            fun, 
            type 
        ];
    }

    getChildReplacement(child: Node, context: Context): Transform[] | undefined {
        
        const index = this.statements.indexOf(child as Expression);
        if(index >= 0) {
            const statement = this.statements[index];
            if(statement instanceof Expression)
                return [
                    ... this.getInsertions().map(insertion => new Replace(context, child, insertion)),
                    ...(index === this.statements.length - 1 ? getExpressionReplacements(this, statement, context) : []),
                ]
        }

    }
    getInsertionBefore(child: Node, context: Context, position: number): Transform[] | undefined {

        if(context.source.isEmptyLine(position)) {
            const index = this.statements.indexOf(child as Expression);
            if(index >= 0) {
                const firstToken = child.nodes(n => n instanceof Token)[0];
                if(firstToken instanceof Token && context.source.spaces.hasLineBreak(firstToken))
                    return this.getInsertions().map(insertion => new Append(context, position, this, this.statements, child, insertion));
            }
        }

    }

    getInsertionAfter(context: Context, position: number): Transform[] | undefined {

        if(this.root) return [];

        return [
            ...getPossiblePostfix(context, this, this.getType(context)),
            ...context.source.isEmptyLine(position) ?
                [
                    ...this.getInsertions().map(insertion => new Append(context, position, this, this.statements, undefined, insertion)),
                    ...(this.root ? getExpressionInsertions(position, this, this.statements, undefined, context) : [])
                ] : []
        ];

    }

    getChildRemoval(child: Node, context: Context): Transform | undefined {
        return new Remove(context, this, child);
    }

    getChildPlaceholderLabel(child: Node): Translations | undefined {
        if(this.statements.includes(child as Expression)) return {
            "😀": TRANSLATE,
            eng: "statement"
        };
    }
    getDescriptions(): Translations {
        return {
            "😀": TRANSLATE,
            eng: "Evaluate one or more expressions"
        }
    }

    getStart() { return this.open ?? this.getFirstLeaf() ?? this; }
    getFinish(): Node { return this.close ?? this.getLast() ?? this; }

    getStartExplanations(): Translations { 
        return {
            "😀": TRANSLATE,
            eng: "We'll evaluate all of the expressions first."
        }
    }

    getFinishExplanations(): Translations {
        return {
            "😀": TRANSLATE,
            eng: "Now that we're done, we'll evaluate to the last expression's value."
        }
    }

}