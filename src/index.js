import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router';
import { Route, Switch } from 'react-router';
import Cookies from 'universal-cookie';
import { AUTH_USER } from './actions/types';
import Header from './components/header';
import Footer from './components/footer';
import Login from './components/auth/login';
import Logout from './components/auth/logout';
import Profile from './components/auth/profile';
import Register from './components/auth/register';
import RequireAuth from './components/auth/require_auth';
import RequireUnauth from './components/auth/require_unauth';
import CruiseMenu from './components/cruise_menu';
import Users from './components/users';
import Tasks from './components/tasks';
import EventLogging from './components/event_logging';
import EventManagement from './components/event_management';
import EventTemplates from './components/event_templates';
import Lowerings from './components/lowerings';
import LoweringMap from './components/lowering_map';
import LoweringGallery from './components/lowering_gallery';
import LoweringReplay from './components/lowering_replay';
import LoweringReview from './components/lowering_review';
import Cruises from './components/cruises';
import ForgotPassword from './components/auth/forgot_password';
import ResetPassword from './components/auth/reset_password';

import { library } from '@fortawesome/fontawesome-svg-core';

import { faArrowLeft } from '@fortawesome/free-solid-svg-icons/faArrowLeft';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons/faArrowRight';
import { faBackward } from '@fortawesome/free-solid-svg-icons/faBackward';
import { faCalculator } from '@fortawesome/free-solid-svg-icons/faCalculator';
import { faChevronUp } from '@fortawesome/free-solid-svg-icons/faChevronUp';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons/faChevronDown';
import { faClipboard } from '@fortawesome/free-solid-svg-icons/faClipboard';
import { faComment } from '@fortawesome/free-solid-svg-icons/faComment';
import { faCompress } from '@fortawesome/free-solid-svg-icons/faCompress';
import { faDownload } from '@fortawesome/free-solid-svg-icons/faDownload';
import { faExpand } from '@fortawesome/free-solid-svg-icons/faExpand';
import { faEye } from '@fortawesome/free-solid-svg-icons/faEye';
import { faEyeSlash } from '@fortawesome/free-solid-svg-icons/faEyeSlash';
import { faForward } from '@fortawesome/free-solid-svg-icons/faForward';
import { faLink } from '@fortawesome/free-solid-svg-icons/faLink';
import { faPause } from '@fortawesome/free-solid-svg-icons/faPause';
import { faPencilAlt } from '@fortawesome/free-solid-svg-icons/faPencilAlt';
import { faPlay } from '@fortawesome/free-solid-svg-icons/faPlay';
import { faPlus } from '@fortawesome/free-solid-svg-icons/faPlus';
import { faStepBackward } from '@fortawesome/free-solid-svg-icons/faStepBackward';
import { faStepForward } from '@fortawesome/free-solid-svg-icons/faStepForward';
import { faTrash } from '@fortawesome/free-solid-svg-icons/faTrash';
import { faVial } from '@fortawesome/free-solid-svg-icons/faVial';
import { faUser } from '@fortawesome/free-solid-svg-icons/faUser';
import { faWindowMaximize } from '@fortawesome/free-solid-svg-icons/faWindowMaximize';

library.add(faArrowLeft,faArrowRight,faBackward,faCalculator,faChevronDown,faChevronUp,faClipboard,faComment,faCompress,faDownload,faExpand,faEye,faEyeSlash,faForward,faLink,faPause,faPencilAlt,faPlay,faPlus,faStepBackward,faStepForward,faTrash,faVial,faUser,faWindowMaximize);

import './assets/style/bootstrap.min.css';
import 'leaflet/dist/leaflet.css';
import './assets/style/style.css';

import configureStore from './store';
import history from './history';

const store = configureStore();

const cookies = new Cookies();
const token = cookies.get('token');
if (token) {
  store.dispatch({ type: AUTH_USER });
}

ReactDOM.render(
  <Provider store={store}>
    <ConnectedRouter history={history}>
      <div>
        <Header />
        <Switch>
          <Route path={ `/` } exact={true} component={RequireAuth(EventLogging)}/>
          <Route path={ `/github`} exact={true} component={() => window.location = 'https://github.com/webbpinner/sealog-client-jason'}/>
          <Route path={ `/license`} exact={true} component={() => window.location = 'http://www.gnu.org/licenses/gpl-3.0.html'}/>
          <Route path={ `/profile` } exact={true} component={RequireAuth(Profile)} />
          <Route path={ `/register` } exact={true} component={Register} />
          <Route path={ `/forgotPassword` } exact={true} component={ForgotPassword} />
          <Route path={ `/resetPassword/:token` } exact={true} component={ResetPassword} />
          <Route path={ `/login` } exact={true} component={RequireUnauth(Login)} />
          <Route path={ `/logout` } exact={true} component={Logout} />
          <Route path={ `/users` } exact={true} component={RequireAuth(Users)} />
          <Route path={ `/tasks` } exact={true} component={RequireAuth(Tasks)} />
          <Route path={ `/cruises` } exact={true} component={RequireAuth(Cruises)} />
          <Route path={ `/cruise_menu` } exact={true} component={RequireAuth(CruiseMenu)} />
          <Route path={ `/lowerings` } exact={true} component={RequireAuth(Lowerings)} />
          <Route path={ `/lowering_gallery/:id` } exact={true} component={RequireAuth(LoweringGallery)} />
          <Route path={ `/lowering_map/:id` } exact={true} component={RequireAuth(LoweringMap)} />
          <Route path={ `/lowering_replay/:id` } exact={true} component={RequireAuth(LoweringReplay)} />
          <Route path={ `/lowering_review/:id` } exact={true} component={RequireAuth(LoweringReview)} />
          <Route path={ `/event_management` } exact={true} component={RequireAuth(EventManagement)} />
          <Route path={ `/event_templates` } exact={true} component={RequireAuth(EventTemplates)} />
        </Switch>
        <Footer />
      </div>
    </ConnectedRouter>
  </Provider>
  , document.querySelector('.container'));
