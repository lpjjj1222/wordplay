import type Bind from "../nodes/Bind";
import Conflict from "./Conflict";


export class UnexpectedEtc extends Conflict {
    readonly bind: Bind;
    constructor(bind: Bind) {
        super(false);
        this.bind = bind;
    }

    getConflictingNodes() {
        return { primary: this.bind.etc === undefined ? [] : [ this.bind.etc ] };
    }

    getExplanations() { 
        return {
            eng: `Variable length only applies to evaluations, they can't go here.`
        }
    }

}