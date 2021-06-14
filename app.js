const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3004, () => {
      console.log("Server Running At http://localhost:3004/");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertPlayerDetails = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDetails = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

const convertPlayerMatchScoreDetails = (dbObject) => {
  return {
    playerMatchId: dbObject.player_match_id,
    playerId: dbObject.player_id,
    matchId: dbObject.match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};

//Get players
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT * FROM player_details;`;
  const playersArray = await db.all(getPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) => convertPlayerDetails(eachPlayer))
  );
});

//Get player with playerId
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT * FROM player_details WHERE player_id = ${playerId};`;
  const player = await db.get(getPlayerQuery);
  response.send(convertPlayerDetails(player));
});

// Update playerDetails
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
    UPDATE
        player_details
    SET
        player_name='${playerName}';`;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//Get match with matchId
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT * FROM match_details WHERE match_id = ${matchId};`;
  const match = await db.get(getMatchQuery);
  response.send(convertMatchDetails(match));
});

//Get matches with playerId
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchWithPlayerIdQuery = `
    SELECT
        match_id,
        match,
        year
    FROM match_details NATURAL JOIN player_match_score
    WHERE player_id = ${playerId};`;
  const matchArray = await db.all(getMatchWithPlayerIdQuery);
  response.send(matchArray.map((eachMatch) => convertMatchDetails(eachMatch)));
});

//Get players with matchId
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersWithMatchIdQuery = `
    SELECT
        *
    FROM player_match_score 
        NATURAL JOIN player_details
    WHERE 
        match_id = ${matchId};`;
  const playerArray = await db.all(getPlayersWithMatchIdQuery);
  response.send(
    playerArray.map((eachPlayer) => convertPlayerDetails(eachPlayer))
  );
});

//Get player Stats
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerStatsWithIdQuery = `
    SELECT
        player_id AS playerId,
        player_name AS playerName,
        SUM(score) AS totalScore,
        SUM(fours) AS totalFours,
        SUM(sixes) AS totalSixes
    FROM player_match_score 
        NATURAL JOIN player_details
    WHERE 
        player_id = ${playerId};`;
  const playerStats = await db.get(getPlayerStatsWithIdQuery);
  response.send(playerStats);
});

module.exports = app;
