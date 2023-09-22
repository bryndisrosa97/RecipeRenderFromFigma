import express from 'express';
import { requireAuth, checkUserIsAdmin } from '../authentication/auth.js';
import { catchErrors } from '../utils/catchErrors.js';

import {
  listSeries,
  createSerie,
  listSerie,
  updateSerie,
  deleteSerie,
  // rateSerie,
  // updateRate,
  // deleteRate,
  // createState,
  // updateState,
  // deleteState
} from './series.js';

import {
  listSeasons,
  createSeason,
  listSeason,
  deleteSeason,
} from './seasons.js';

import {
  createEpisode,
  listEpisode,
  deleteEpisode,
} from './episodes.js';

import {
  listGenres,
  createGenre,
} from './genres.js';

import {
  listUsers,
  listUser,
  updateUserRoute,
  currentUserRoute,
  updateCurrentUser,
} from './users.js';

import {
  createState,
  updateState,
  deleteState,
} from './state.js';

import {
  rateSerie,
  updateRate,
  deleteRate,
} from './rate.js';

export const router = express.Router();

const requireAdmin = [
  requireAuth,
  checkUserIsAdmin,
];

function indexRoute(req, res) {
  const data = {
    tv: {
      series: {
        href: '/tv',
        methods: [
          'GET',
          'POST',
        ],
      },
      serie: {
        href: '/tv/{id}',
        methods: [
          'GET',
          'PATCH',
          'DELETE',
        ],
      },
      rate: {
        href: '/tv/{id}/rate',
        methods: [
          'POST',
          'PATCH',
          'DELETE',
        ],
      },
      state: {
        href: '/tv/{id}/state',
        methods: [
          'POST',
          'PATCH',
          'DELETE',
        ],
      },
    },
    seasons: {
      seasons: {
        href: '/tv/{id}/season',
        methods: [
          'GET',
          'POST',
        ],
      },
      season: {
        href: '/tv/{id}/season/{season}',
        methods: [
          'GET',
          'DELETE',
        ],
      },
    },
    episodes: {
      episodes: {
        href: '/tv/{id}/season/{season}/episode',
        methods: [
          'POST',
        ],
      },
      episode: {
        href: '/tv/{id}/season/{season}/episode/{episode}',
        methods: [
          'GET',
          'DELETE',
        ],
      },
    },
    genres: {
      genres: {
        href: '/genres',
        methods: [
          'GET',
          'POST',
        ],
      },
    },
    users: {
      users: {
        href: '/users',
        methods: [
          'GET',
        ],
      },
      user: {
        href: '/users/{id}',
        methods: [
          'GET',
          'PATCH',
        ],
      },
      register: {
        href: '/users/register',
        methods: [
          'POST',
        ],
      },
      login: {
        href: '/users/login',
        methods: [
          'POST',
        ],
      },
      me: {
        href: '/users/me',
        methods: [
          'GET',
          'PATCH',
        ],
      },
    },
  };
  return res.json(data);
}

router.get('/', indexRoute);

router.get('/users', requireAdmin, catchErrors(listUsers));
router.get('/users/me', requireAuth, catchErrors(currentUserRoute));
router.patch('/users/me', requireAuth, catchErrors(updateCurrentUser));
router.get('/users/:id', requireAdmin, catchErrors(listUser));
router.patch('/users/:id', requireAdmin, catchErrors(updateUserRoute));

router.get('/tv', catchErrors(listSeries));
router.post('/tv', requireAdmin, catchErrors(createSerie));
router.get('/tv/:id', catchErrors(listSerie));
router.patch('/tv/:id', requireAdmin, catchErrors(updateSerie));
router.delete('/tv/:id', requireAdmin, catchErrors(deleteSerie));
router.post('/tv/:id/rate', requireAuth, catchErrors(rateSerie));
router.patch('/tv/:id/rate', requireAuth, catchErrors(updateRate));
router.delete('/tv/:id/rate', requireAuth, catchErrors(deleteRate));
router.post('/tv/:id/state', requireAuth, catchErrors(createState));
router.patch('/tv/:id/state', requireAuth, catchErrors(updateState));
router.delete('/tv/:id/state', requireAuth, catchErrors(deleteState));

router.get('/tv/:id/season', catchErrors(listSeasons));
router.post('/tv/:id/season', requireAdmin, catchErrors(createSeason));
router.get('/tv/:id/season/:season', catchErrors(listSeason));
router.delete('/tv/:id/season/:season', requireAdmin, catchErrors(deleteSeason));

router.post('/tv/:id/season/:season/episode', requireAdmin, catchErrors(createEpisode));
router.get('/tv/:id/season/:season/episode/:episode', catchErrors(listEpisode));
router.delete('/tv/:id/season/:season/episode/:episode', requireAdmin, catchErrors(deleteEpisode));

router.get('/genres', catchErrors(listGenres));
router.post('/genres', requireAdmin, catchErrors(createGenre));
