import { enumType, objectType } from "nexus";

export const StageTypeEnum = enumType({
	name: "StageType",
	members: ["Short","Medium","Long","Unsanctioned"],
});

export const StageObject = objectType({
	name: "Stage",
	definition(t) {
		t.int("id");
		t.dateTime("createAt");
		t.field("image", {
			type: "Image",
		}); 
		t.int("imageId");
		t.string("name");
		t.nullable.string("description");
		t.int("papers");
		t.int("poppers");
		t.int("noshoots");
		t.int("gunCondition");
		t.field("designer", {
			type: "Shooter",
		});
		t.int("designerId");
		t.float("walkthroughTime", {
			description: "unit: minutes",
		});
		t.nullable.list.field("scorelists", {
			type: "Scorelist",
		});
		t.int("minRounds");
		t.int("maxScore");
		t.field("stageType", {
			type: "StageType",
		});
		t.nullable.list.field("tags", {
			type: "StageTag",
		});
	},
});