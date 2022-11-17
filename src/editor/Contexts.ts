import { getContext } from "svelte";
import type { Writable } from "svelte/store";
import type { InsertionPoint } from "../models/Caret";
import type Caret from "../models/Caret";
import type Project from "../models/Project";
import type LanguageCode from "../nodes/LanguageCode";
import type Node from "../nodes/Node";
import type Token from "../nodes/Token";
import type { Highlights } from "./Highlights";

export type CaretContext = Writable<Caret> | undefined;
export const CaretSymbol = Symbol("caret");
export function getCaret() { return getContext<CaretContext>(CaretSymbol); }

export type HoveredContext = Writable<Node | undefined> | undefined;
export const HoveredSymbol = Symbol("hovered");
export function getHovered() { return getContext<HoveredContext>(HoveredSymbol); }

export type InsertionPointsContext = Writable<Map<Token,InsertionPoint>> | undefined;
export const InsertionPointsSymbol = Symbol("insertions");
export function getInsertionPoints() { return getContext<InsertionPointsContext>(InsertionPointsSymbol); }

export type DraggedContext = Writable<Node | undefined>;
export const DraggedSymbol = Symbol("dragged");
export function getDragged() { return getContext<DraggedContext>(DraggedSymbol); }

export type LanguageContext = Writable<LanguageCode[]>;
export const LanguageSymbol = Symbol("language");
export function getLanguages() { return getContext<LanguageContext>(LanguageSymbol); }

export type ProjectContext = Writable<Project>;
export const ProjectSymbol = Symbol("project");
export function getProject() { return getContext<ProjectContext>(ProjectSymbol); }

export type HighlightContext = Writable<Highlights> | undefined;
export const HighlightSymbol = Symbol("highlight");
export function getHighlights() { return getContext<HighlightContext>(HighlightSymbol); }
