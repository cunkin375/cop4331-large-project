// A MongoDB view avoids duplicated totals and stale rankings.
export const leaderboardPipeline = [
  { $sort: { earningsCents: -1, _id: 1 } },
  { $limit: 10 },
  { $project: { username: 1, earningsCents: 1, gamesPlayed: 1, wins: 1, losses: 1, pushes: 1 } },
];
export class Leaderboard {
  constructor(db) { this.collection = db.collection('leaderboard'); }
  async top10() {
    const players = await this.collection.find({}).sort({ earningsCents: -1, _id: 1 }).limit(10).toArray();
    return players.map((player, index) => ({ rank: index + 1, ...player }));
  }
}
