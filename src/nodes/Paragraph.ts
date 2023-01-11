import type Conflict from '../conflicts/Conflict';
import type Translation from '../translation/Translation';
import ConceptLink from './ConceptLink';
import type Example from './Example';
import WebLink from './WebLink';
import Node, { type Field, type Replacement } from './Node';
import Words from './Words';

export type Content = Words | WebLink | ConceptLink | Example;

export default class Paragraph extends Node {
    readonly content: Content[];

    constructor(content: Content[]) {
        super();

        this.content = content;
    }

    getGrammar(): Field[] {
        return [{ name: 'content', types: [[Words, WebLink, ConceptLink]] }];
    }

    computeConflicts(): void | Conflict[] {
        return [];
    }

    clone(replace?: Replacement | undefined): this {
        return new Paragraph(
            this.replaceChild('content', this.content, replace)
        ) as this;
    }

    getNodeTranslation(translation: Translation) {
        return translation.nodes.Paragraph;
    }
}
