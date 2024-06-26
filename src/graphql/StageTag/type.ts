import { objectType } from "nexus";

export const StageTag = objectType({
	name: "StageTag",
	definition(t) {
		t.implements("Node");
		t.nonNull.string("title");
		t.nonNull.string("color", {
			description: "format: rgba(x,x,x,x)",
		});
	},
});

export const TagOnStage = objectType({
	name: "TagOnStage",
	definition(t) {
		t.implements("Node");
		t.nonNull.field("tag", {
			type: "StageTag",
		});
	},
});