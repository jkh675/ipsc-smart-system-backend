// import { MultiElo } from "multi-elo";
import { log, LogLevel, prisma } from "../../context";

const LOG_CAT = "ELO System";

export type ShooterId = number;
export type ShooterScore = number;
export type Elo = number;

export type ShooterElo = {
	shooterId: ShooterId;
	elo: Elo;
	score: ShooterScore;
};



export async function calculateElo(shooter: ShooterElo[]): Promise<Omit<ShooterElo, "score">[]> {
	const { MultiElo } = await import("multi-elo");
	log(LogLevel.DEBUG, `Calculating elo, shooterElos: ${JSON.stringify(shooter)}`, LOG_CAT);
	const elo = new MultiElo({s: 7, k: 24, d: 1000, verbose: true});
	
	const sortedShooter = shooter.sort((a, b) => b.score - a.score);
	const shooterElos: Elo[] = sortedShooter.map((shooter) => shooter.elo);
	log(LogLevel.DEBUG, `Sorted shooter		: ${JSON.stringify(sortedShooter)}`, LOG_CAT);
	log(LogLevel.DEBUG, `Shooter elos		: ${JSON.stringify(shooterElos)}`, LOG_CAT);
	const newElos = elo.getNewRatings(shooterElos);

	return newElos.map((elo, index) => {
		return {
			elo: elo,
			shooterId: sortedShooter[index].shooterId,
		};
	});
}


export async function updateElo(/* scorelistId: number, round: number */) {
	log(LogLevel.INFO, "Updating elo", LOG_CAT);
	const scores = await prisma.score.findMany({
		where: {
			state: {
				notIn: ["DidNotScore"],
			},
		},
		select: {
			shooterId: true,
			hitFactor: true,
		},
	});
	if (scores.length > 1) {
		const shooters = await prisma.shooter.findMany({
			select: {
				id: true,
			},
		});
		const elos: ShooterElo[] = [];
		for (const shooter of shooters) {
			const shooterElo = await prisma.elo.findFirst({
				where: {
					shooterId: shooter.id,
				},
				orderBy: {
					tick: "desc",
				},
			});
			const score = await prisma.score.aggregate({
				where: {
					shooterId: shooter.id,
				},
				_sum: {
					hitFactor: true,
				},
				_avg: {
					accuracy: true,
				},
			});
			elos.push({
				shooterId: shooter.id,
				elo: shooterElo?.elo || parseInt(process.env.INIT_ELO || "1000"),
				score: (score._avg.accuracy || 0) * (score._sum.hitFactor || 0),
			});
		}
		const currentTick = (await prisma.elo.findFirst({
			orderBy: {
				tick: "desc",
			},
			select: {
				tick: true,
			},
		}))?.tick || 0;
		log(LogLevel.DEBUG, `Original elos	: ${JSON.stringify(elos)}`, LOG_CAT);
		const newElos = await calculateElo(elos);
		log(LogLevel.DEBUG, `New elos		: ${JSON.stringify(newElos)}`, LOG_CAT);
		for (const elo of newElos) {
			await prisma.elo.create({
				data: {
					tick: currentTick + 1,
					elo: elo.elo,
					shooter: {
						connect: {	
							id: elo.shooterId,
						},
					},
				},
			});
		}
		
		return;
	} else {
		log(LogLevel.WARN, "Not enough scores (less than 2) to calculate elo", LOG_CAT);
		return;
	}
}

