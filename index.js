'use strict';

// Bạn cần thực hiện các bước sau đây để lấy file chứng thực theo hướng dẫn từ
// https://developers.google.com/identity/protocols/application-default-credentials
//
// 1: Vào url https://console.developers.google.com/project/_/apis/credentials
// 2: Từ drop-down các dự án, chọn dự án của QuizDialogflowVN
// 3: Trên trang Credentials, chọn Create credentials, chọn Service account key
// 4: Từ Service account drop-down, chọn Dialogflow Integrations
// 5: Mục Key type, chọn JSON, nhấn nút Create để download file chứng thực
process.env.GOOGLE_APPLICATION_CREDENTIALS = '../Quiz-dont-commit.json';

const readline = require('readline');

const dialogflow = require('dialogflow');
const sessionClient = new dialogflow.SessionsClient();
const contextsClient = new dialogflow.ContextsClient();

// Bạn có thể lấy thông tin project ID trong phần setting của Dialogflow agent
// https://dialogflow.com/docs/agents#settings
const projectId = 'quizdialogflowvn';
const sessionId = 'quizdialogflowvn-session-id';
const sessionPath = sessionClient.sessionPath(projectId, sessionId);

/**
 * Listing contexts
*/
function listContexts() {
  return contextsClient.listContexts({parent: sessionPath}).then((res) => {
    return res[0];
  }).catch((err) => { });
}

/**
 * Delete a context of current session
*/
function deleteContext(context) {
  return contextsClient.deleteContext({name: context.name})
    .then(() => { })
    .catch((err) => { });
}

/**
 * Clear all context of current session
*/
function clearContexts() {
  return listContexts().then((contexts) => {
    return Promise.all(
      contexts.map((context) => {
        return deleteContext(context);
      })
    );
  });
}

let totalScore = 0;
let totalQuestions = 0;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'User> ',
});

rl.prompt();

rl.on('line', (line) => {
  let userSay = line.trim();

  if (userSay.length <= 0) {
    rl.prompt();
    return;
  }

  // The text query request.
  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: userSay,
        languageCode: 'en-US',
      },
    },
  };

  // Send request and log result
  sessionClient
    .detectIntent(request)
    .then((responses) => {
      const result = responses[0].queryResult;

      if (!!result && !!result.parameters && !!result.parameters.fields) {
        let score = result.parameters.fields.score;
        if (!!score) {
          totalQuestions += 1;
          totalScore += Number(score.stringValue);
          clearContexts();
        }
      }

      result.fulfillmentMessages.forEach((msg, index, list) => {
        if (index <= 0) {
          console.log('Bot > ' + msg.text.text[0]);
        } else {
          console.log('      ' + msg.text.text[0]);
        }
      });
      rl.prompt();
    })
    .catch((err) => {
      console.error('ERROR:', err);
    });
}).on('close', () => {
  console.log('\nHave a great day! Score: ' + totalScore + '/' + totalQuestions);
  process.exit(0);
});
