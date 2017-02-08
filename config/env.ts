import * as path from 'path';

interface ConfigSettings {
  env: string;
  debug: boolean;
  rootFolder: string;
  name: string;
  port: number;
  github: {
    clientID: string;
    clientSecret: string;
  };
  private_folder: string;
  path_to_classlist: string;
  path_to_admins: string;
  path_to_tokens: string;
  path_to_students: string;
  path_to_teams: string;
  autotest_auth: string;
  client_id: string;
  client_secret: string;
  githubcontroller_token: string;
  githubcontroller_user: string;
  enable_app_store: boolean;
}

// default settings are for development environment
const config: ConfigSettings = {
  env: process.env.NODE_ENV || 'development',
  debug: process.env.DEBUG || false,
  rootFolder: path.join(__dirname, '/..'),
  name: 'ClassPortal API',
  port: 5000,
  github: {
    clientID: process.env.GITHUB_CLIENTID,
    clientSecret: process.env.GITHUB_SECRET,
  },
  private_folder: 'priv/',
  path_to_classlist: 'priv/classlist.csv',
  path_to_admins: 'priv/admins.json',
  path_to_tokens: 'priv/tokens.json',
  path_to_students: 'priv/students.json',
  path_to_teams: 'priv/teams.json',
  autotest_auth: 'user:pass',
  client_id: '',
  client_secret: '',
  githubcontroller_token: '',
  githubcontroller_user: '',
  enable_app_store: true
};

// settings for test environment
if (config.env === 'test') {
}

// settings for production environment
if (config.env === 'production') {
  config.port = 443;
}

export { config };
