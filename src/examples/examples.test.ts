import { test, expect } from 'vitest';
import eng_cs from '../translation/translations/eng';
import { examples, makeProject, type Stuff } from './examples';

test.each(examples)(`Ensure $name has no conflicts`, (example: Stuff) => {
    const project = makeProject(example);
    project.analyze();
    const context = project.getContext(project.main);
    for (const conflict of Array.from(
        project.primaryConflicts.values()
    ).flat()) {
        const conflictingNodes = conflict.getConflictingNodes();
        console.error(conflictingNodes.primary.explanation(eng_cs, context));
    }
    expect(project.primaryConflicts).toHaveLength(0);
});
