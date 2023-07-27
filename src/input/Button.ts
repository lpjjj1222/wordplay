import type Evaluator from '@runtime/Evaluator';
import Stream from '@runtime/Stream';
import StreamDefinition from '@nodes/StreamDefinition';
import { getDocLocales } from '@locale/getDocLocales';
import { getNameLocales } from '@locale/getNameLocales';
import BooleanType from '../nodes/BooleanType';
import Bind from '@nodes/Bind';
import UnionType from '@nodes/UnionType';
import NoneType from '@nodes/NoneType';
import Bool from '@runtime/Bool';
import StreamType from '@nodes/StreamType';
import createStreamEvaluator from './createStreamEvaluator';
import type Locale from '../locale/Locale';
import NoneLiteral from '../nodes/NoneLiteral';

export default class Button extends Stream<Bool> {
    on: boolean = false;
    down: boolean | undefined;

    constructor(evaluator: Evaluator, down: boolean | undefined) {
        super(
            evaluator,
            evaluator.project.shares.input.button,
            new Bool(evaluator.getMain(), false)
        );

        this.down = down;
    }

    setDown(down: boolean | undefined) {
        this.down = down;
    }

    record(down: boolean) {
        if (this.on && (this.down === undefined || this.down === down))
            this.add(new Bool(this.creator, down));
    }

    start() {
        this.on = true;
    }
    stop() {
        this.on = false;
    }

    getType() {
        return StreamType.make(BooleanType.make());
    }
}

export function createButtonDefinition(locales: Locale[]) {
    const DownBind = Bind.make(
        getDocLocales(locales, (locale) => locale.input.Button.down.doc),
        getNameLocales(locales, (locale) => locale.input.Button.down.names),
        UnionType.make(BooleanType.make(), NoneType.make()),
        // Default to none
        NoneLiteral.make()
    );
    return StreamDefinition.make(
        getDocLocales(locales, (locale) => locale.input.Button.doc),
        getNameLocales(locales, (locale) => locale.input.Button.names),
        [DownBind],
        createStreamEvaluator(
            BooleanType.make(),
            Button,
            (evaluation) =>
                new Button(
                    evaluation.getEvaluator(),
                    evaluation.get(DownBind.names, Bool)?.bool
                ),
            (stream, evaluation) =>
                stream.setDown(evaluation.get(DownBind.names, Bool)?.bool)
        ),
        BooleanType.make()
    );
}
