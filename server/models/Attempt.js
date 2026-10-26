export class Attempt {
  constructor(db) { this.collection = db.collection('attempts'); }

  async save(game) {
    if (game.results.length !== 10) throw new TypeError('An attempt requires exactly 10 rounds');
    const attempt = {
      user: game.userId,
      userId: game.userId, rounds: game.results,
      sessionId: game._id,
      score: game.results.reduce((sum, round) => sum + round.points, 0),
      createdAt: game.createdAt, completedAt: new Date(),
    };
    // The game ID is also the attempt ID, so retries cannot duplicate scores.
    await this.collection.updateOne({ _id: game._id }, { $setOnInsert: attempt }, { upsert: true });
  }
}
