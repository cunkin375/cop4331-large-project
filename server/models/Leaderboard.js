// A MongoDB view avoids duplicated totals and stale rankings.
export const leaderboardPipeline = [
  { $sort: { earningsCents: -1, _id: 1 } },
  { $limit: 10 },
  { $project: { username: 1, earningsCents: 1, gamesPlayed: 1, wins: 1, losses: 1, pushes: 1 } },
];
export class Leaderboard {
  constructor(db) { this.db = db; this.collection = db.collection('leaderboard'); }
  async top10() {
    const players = await this.collection.find({}).sort({ earningsCents: -1, _id: 1 }).limit(10).toArray();
    return players.map((player, index) => ({ rank: index + 1, ...player }));
  }

  async bestAttempts(limit = 10) {
    const rows = await this.db.collection('attempts').aggregate([
      { $sort: { score: -1, completedAt: 1 } },
      { $group: { _id: '$user', score: { $first: '$score' }, completedAt: { $first: '$completedAt' } } },
      { $sort: { score: -1, _id: 1 } },
      { $limit: limit },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { _id: 0, username: '$user.username', score: 1 } },
    ]).toArray();
    let previousScore;
    let rank = 0;
    return rows.map((row, index) => {
      if (row.score !== previousScore) rank = index + 1;
      previousScore = row.score;
      return { rank, ...row };
    });
  }
}
