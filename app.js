const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());
let dataBase = null;
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const serverDbInitialization = async () => {
  try {
    dataBase = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running At http://localhost:3000");
    });
  } catch (error) {
    console.log(`Data Base Error is ${error}`);
    process.exit(1);
  }
};
serverDbInitialization();

//API 1
// Returns a list of all the players in the player table

const convertIntoPlayersList = (objItem) => {
  return {
    playerId: objItem.player_id,
    playerName: objItem.player_name,
  };
};

app.get("/players/", async (request, response) => {
  const selectPlayerListQuery = `
    SELECT 
      *
    FROM 
      player_details;`;
  const selectPlayerListQueryResponse = await dataBase.all(
    selectPlayerListQuery
  );
  response.send(
    selectPlayerListQueryResponse.map((each) => convertIntoPlayersList(each))
  );
});

//API 2
//Returns a specific player based on the player ID

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getSpecificPlayerIdQuery = `
  SELECT
    * 
  FROM 
  player_details
  WHERE 
    player_id = ${playerId};`;
  const getSpecificPlayerIdQueryResponse = await dataBase.get(
    getSpecificPlayerIdQuery
  );
  response.send(convertIntoPlayersList(getSpecificPlayerIdQueryResponse));
});

//API 3
//Updates the details of a specific player based on the player ID

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const UpDatePlayerNameIQuery = `
  UPDATE 
    player_details
  SET 
    player_name = '${playerName}'
  WHERE 
  player_id = ${playerId}`;
  const UpDatePlayerNameIQueryResponse = await dataBase.run(
    UpDatePlayerNameIQuery
  );
  response.send("Player Details Updated");
});

//API 4
//Returns the match details of a specific match

const convertMatchDetailsApi4 = (objItem) => {
  return {
    matchId: objItem.match_id,
    match: objItem.match,
    year: objItem.year,
  };
};

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchDetailsQuery = `
    SELECT
      *
    FROM
      match_details
    WHERE
      match_id = ${matchId}`;
  const matchDetailsQueryResponse = await dataBase.get(matchDetailsQuery);
  response.send(convertMatchDetailsApi4(matchDetailsQueryResponse));
});

//API 5
//Returns a list of all the matches of a player

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const matchesOfPlayersQuery = `
    SELECT 
    *
    FROM 
    player_match_score
    where 
    player_id =${playerId};`;
  const matchesOfPlayersQueryResponse = await dataBase.all(
    matchesOfPlayersQuery
  );
  const matchIdArray = matchesOfPlayersQueryResponse.map((each) => {
    return each.match_id;
  });
  const getMatchDetailsQuery = `
    select 
    * 
    from 
    match_details
    where 
    match_id IN (${matchIdArray});`;
  const fetchMatchDetailsResponse = await dataBase.all(getMatchDetailsQuery);
  response.send(
    fetchMatchDetailsResponse.map((each) => convertMatchDetailsApi4(each))
  );
});

//API 6
//Returns a list of players of a specific match

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersOfMatchQuery = ` 
    select 
    * 
    from 
    player_match_score 
    NATURAL JOIN player_details 
    WHERE match_id=${matchId};`;
  const getPlayersOfMatchQueryResponse = await dataBase.all(
    getPlayersOfMatchQuery
  );
  response.send(
    getPlayersOfMatchQueryResponse.map((each) => convertIntoPlayersList(each))
  );
});

//API 7
//Returns the statistics of the total score, fours, sixes of a specific player based on the player ID

const playerStatsObject = (playerName, statsObject) => {
  return {
    playerId: statsObject.player_id,
    playerName: playerName,
    totalScore: statsObject.totalScore,
    totalFours: statsObject.totalFours,
    totalSixes: statsObject.totalSixes,
  };
};

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerNameQuery = `
    select 
    player_name 
    from player_details
    where
    player_id = ${playerId};`;
  const getPlayerNameQueryResponse = await dataBase.get(getPlayerNameQuery);
  const getPlayerStatsQuery = `
    select 
    player_id,
    sum(score) AS totalScore,
    sum(fours) As totalFours,
    sum(sixes) As totalSixes
    from 
    player_match_score
    where 
    player_id = ${playerId};`;
  const getPlayerStatsQueryResponse = await dataBase.get(getPlayerStatsQuery);
  response.send(
    playerStatsObject(
      getPlayerNameQueryResponse.player_name,
      getPlayerStatsQueryResponse
    )
  );
});
module.exports = app;
