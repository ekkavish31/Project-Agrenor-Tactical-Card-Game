/* Weaponless sprites with runtime equipment anchors. */
const TACTICS_SPRITES = {
  "version": 1,
  "size": [
    384,
    384
  ],
  "anchor": [
    0.5,
    0.9375
  ],
  "note": "Native SW/NW idle/action poses in v26 recovery. Legacy SW/NW walking retained; new six-frame candidates require limb-phase review. Runtime main/offhand anchors explicit per pose.",
  "directions": {
    "SE": {
      "idle": {
        "src": "assets/tactics/hero_se_idle.webp",
        "right": [
          0.4951,
          0.5981
        ],
        "left": [
          0.7235,
          0.6034
        ],
        "rotation": 20,
        "rightBehind": false,
        "leftBehind": false,
        "mirrored": false
      },
      "walk-left": {
        "src": "assets/tactics/hero_se_walk-left.webp",
        "right": [
          0.3573,
          0.6668
        ],
        "left": [
          0.7106,
          0.5605
        ],
        "rotation": 15,
        "rightBehind": false,
        "leftBehind": false,
        "mirrored": false
      },
      "walk-right": {
        "src": "assets/tactics/hero_se_walk-right.webp",
        "right": [
          0.687,
          0.5502
        ],
        "left": [
          0.5648,
          0.5741
        ],
        "rotation": 30,
        "rightBehind": false,
        "leftBehind": false,
        "mirrored": false
      },
      "windup": {
        "src": "assets/tactics/hero_se_windup.webp",
        "right": [
          0.5041,
          0.1443
        ],
        "left": [
          0.7458,
          0.6623
        ],
        "rotation": -25,
        "rightBehind": false,
        "leftBehind": false,
        "mirrored": false
      },
      "strike": {
        "src": "assets/tactics/hero_se_strike.webp",
        "right": [
          0.7884,
          0.5604
        ],
        "left": [
          0.6051,
          0.5339
        ],
        "rotation": 100,
        "rightBehind": false,
        "leftBehind": false,
        "mirrored": false
      },
      "guard": {
        "src": "assets/tactics/hero_se_guard.webp",
        "right": [
          0.5327,
          0.5341
        ],
        "left": [
          0.692,
          0.3853
        ],
        "rotation": 10,
        "rightBehind": false,
        "leftBehind": false,
        "mirrored": false
      },
      "hit": {
        "src": "assets/tactics/hero_se_hit.webp",
        "right": [
          0.2445,
          0.5999
        ],
        "left": [
          0.7598,
          0.4033
        ],
        "rotation": -20,
        "rightBehind": false,
        "leftBehind": false,
        "mirrored": false
      },
      "down": {
        "src": "assets/tactics/hero_se_down.webp",
        "right": [
          0.673,
          0.8865
        ],
        "left": [
          0.8191,
          0.844
        ],
        "rotation": 80,
        "rightBehind": false,
        "leftBehind": false,
        "mirrored": false
      },
      "walk": [
        {
          "src": "assets/tactics/hero_se_walk_01.webp",
          "right": [
            0.4,
            0.67
          ],
          "left": [
            0.74,
            0.58
          ],
          "rotation": 15,
          "rightBehind": false,
          "leftBehind": false,
          "mirrored": false
        },
        {
          "src": "assets/tactics/hero_se_walk_02.webp",
          "right": [
            0.38,
            0.67
          ],
          "left": [
            0.74,
            0.58
          ],
          "rotation": 15,
          "rightBehind": false,
          "leftBehind": false,
          "mirrored": false
        },
        {
          "src": "assets/tactics/hero_se_walk_03.webp",
          "right": [
            0.37,
            0.64
          ],
          "left": [
            0.74,
            0.57
          ],
          "rotation": 15,
          "rightBehind": false,
          "leftBehind": false,
          "mirrored": false
        },
        {
          "src": "assets/tactics/hero_se_walk_04.webp",
          "right": [
            0.65,
            0.59
          ],
          "left": [
            0.7,
            0.58
          ],
          "rotation": 30,
          "rightBehind": false,
          "leftBehind": false,
          "mirrored": false
        },
        {
          "src": "assets/tactics/hero_se_walk_05.webp",
          "right": [
            0.73,
            0.57
          ],
          "left": [
            0.68,
            0.6
          ],
          "rotation": 30,
          "rightBehind": false,
          "leftBehind": false,
          "mirrored": false
        },
        {
          "src": "assets/tactics/hero_se_walk_06.webp",
          "right": [
            0.55,
            0.62
          ],
          "left": [
            0.76,
            0.62
          ],
          "rotation": 30,
          "rightBehind": false,
          "leftBehind": false,
          "mirrored": false
        }
      ]
    },
    "SW": {
      "idle": {
        "src": "assets/tactics/hero_sw_idle.webp",
        "right": [
          0.3375,
          0.62613
        ],
        "left": [
          0.59662,
          0.63634
        ],
        "rotation": -18,
        "rightBehind": false,
        "leftBehind": false,
        "mirrored": false,
        "flipImage": false
      },
      "walk-left": {
        "src": "assets/tactics/hero_sw_walk-left.webp",
        "right": [
          0.6427,
          0.6668
        ],
        "left": [
          0.2894,
          0.5605
        ],
        "rotation": -15,
        "rightBehind": false,
        "leftBehind": false,
        "mirrored": true
      },
      "walk-right": {
        "src": "assets/tactics/hero_sw_walk-right.webp",
        "right": [
          0.313,
          0.5502
        ],
        "left": [
          0.4352,
          0.5741
        ],
        "rotation": -30,
        "rightBehind": false,
        "leftBehind": false,
        "mirrored": true
      },
      "windup": {
        "src": "assets/tactics/hero_sw_windup.webp",
        "right": [
          0.21441,
          0.38308
        ],
        "left": [
          0.54183,
          0.64745
        ],
        "rotation": -35,
        "rightBehind": false,
        "leftBehind": false,
        "mirrored": false,
        "flipImage": false
      },
      "strike": {
        "src": "assets/tactics/hero_sw_strike.webp",
        "right": [
          0.13456,
          0.54597
        ],
        "left": [
          0.65612,
          0.62426
        ],
        "rotation": -85,
        "rightBehind": false,
        "leftBehind": false,
        "mirrored": false,
        "flipImage": false
      },
      "guard": {
        "src": "assets/tactics/hero_sw_guard.webp",
        "right": [
          0.37779,
          0.62042
        ],
        "left": [
          0.36417,
          0.47556
        ],
        "rotation": -10,
        "rightBehind": false,
        "leftBehind": false,
        "mirrored": false,
        "flipImage": false
      },
      "hit": {
        "src": "assets/tactics/hero_sw_hit.webp",
        "right": [
          0.29895,
          0.50008
        ],
        "left": [
          0.62292,
          0.61409
        ],
        "rotation": -20,
        "rightBehind": false,
        "leftBehind": false,
        "mirrored": false,
        "flipImage": false
      },
      "down": {
        "src": "assets/tactics/hero_sw_down.webp",
        "right": [
          0.48929,
          0.68729
        ],
        "left": [
          0.82286,
          0.80639
        ],
        "rotation": -70,
        "rightBehind": true,
        "leftBehind": false,
        "mirrored": false,
        "flipImage": false
      },
      "walk": [
        {
          "src": "assets/tactics/hero_se_walk_01.webp",
          "right": [
            0.6,
            0.67
          ],
          "left": [
            0.26,
            0.58
          ],
          "rotation": -15,
          "rightBehind": false,
          "leftBehind": false,
          "mirrored": true,
          "flipImage": true
        },
        {
          "src": "assets/tactics/hero_se_walk_02.webp",
          "right": [
            0.62,
            0.67
          ],
          "left": [
            0.26,
            0.58
          ],
          "rotation": -15,
          "rightBehind": false,
          "leftBehind": false,
          "mirrored": true,
          "flipImage": true
        },
        {
          "src": "assets/tactics/hero_se_walk_03.webp",
          "right": [
            0.63,
            0.64
          ],
          "left": [
            0.26,
            0.57
          ],
          "rotation": -15,
          "rightBehind": false,
          "leftBehind": false,
          "mirrored": true,
          "flipImage": true
        },
        {
          "src": "assets/tactics/hero_se_walk_04.webp",
          "right": [
            0.35,
            0.59
          ],
          "left": [
            0.30000000000000004,
            0.58
          ],
          "rotation": -30,
          "rightBehind": false,
          "leftBehind": false,
          "mirrored": true,
          "flipImage": true
        },
        {
          "src": "assets/tactics/hero_se_walk_05.webp",
          "right": [
            0.27,
            0.57
          ],
          "left": [
            0.31999999999999995,
            0.6
          ],
          "rotation": -30,
          "rightBehind": false,
          "leftBehind": false,
          "mirrored": true,
          "flipImage": true
        },
        {
          "src": "assets/tactics/hero_se_walk_06.webp",
          "right": [
            0.44999999999999996,
            0.62
          ],
          "left": [
            0.24,
            0.62
          ],
          "rotation": -30,
          "rightBehind": false,
          "leftBehind": false,
          "mirrored": true,
          "flipImage": true
        }
      ]
    },
    "NE": {
      "idle": {
        "src": "assets/tactics/hero_ne_idle.webp",
        "right": [
          0.7026,
          0.5706
        ],
        "left": [
          0.5272,
          0.5945
        ],
        "rotation": 20,
        "rightBehind": true,
        "leftBehind": true,
        "mirrored": false
      },
      "walk-left": {
        "src": "assets/tactics/hero_ne_walk-left.webp",
        "right": [
          0.7154,
          0.6265
        ],
        "left": [
          0.5109,
          0.5733
        ],
        "rotation": 15,
        "rightBehind": true,
        "leftBehind": true,
        "mirrored": false
      },
      "walk-right": {
        "src": "assets/tactics/hero_ne_walk-right.webp",
        "right": [
          0.7029,
          0.5652
        ],
        "left": [
          0.4771,
          0.5971
        ],
        "rotation": 30,
        "rightBehind": true,
        "leftBehind": true,
        "mirrored": false
      },
      "windup": {
        "src": "assets/tactics/hero_ne_windup.webp",
        "right": [
          0.6389,
          0.1835
        ],
        "left": [
          0.2591,
          0.6961
        ],
        "rotation": -25,
        "rightBehind": false,
        "leftBehind": true,
        "mirrored": false
      },
      "strike": {
        "src": "assets/tactics/hero_ne_strike.webp",
        "right": [
          0.8262,
          0.5199
        ],
        "left": [
          0.5712,
          0.5412
        ],
        "rotation": 100,
        "rightBehind": false,
        "leftBehind": true,
        "mirrored": false
      },
      "guard": {
        "src": "assets/tactics/hero_ne_guard.webp",
        "right": [
          0.7323,
          0.3688
        ],
        "left": [
          0.5305,
          0.5202
        ],
        "rotation": 10,
        "rightBehind": false,
        "leftBehind": true,
        "mirrored": false
      },
      "hit": {
        "src": "assets/tactics/hero_ne_hit.webp",
        "right": [
          0.2495,
          0.4498
        ],
        "left": [
          0.7621,
          0.5906
        ],
        "rotation": -20,
        "rightBehind": false,
        "leftBehind": true,
        "mirrored": false
      },
      "down": {
        "src": "assets/tactics/hero_ne_down.webp",
        "right": [
          0.7658,
          0.8488
        ],
        "left": [
          0.5772,
          0.8328
        ],
        "rotation": 80,
        "rightBehind": false,
        "leftBehind": true,
        "mirrored": false
      },
      "walk": [
        {
          "src": "assets/tactics/hero_ne_walk_01.webp",
          "right": [
            0.75,
            0.65
          ],
          "left": [
            0.56,
            0.59
          ],
          "rotation": 15,
          "rightBehind": true,
          "leftBehind": true,
          "mirrored": false
        },
        {
          "src": "assets/tactics/hero_ne_walk_02.webp",
          "right": [
            0.75,
            0.65
          ],
          "left": [
            0.56,
            0.59
          ],
          "rotation": 15,
          "rightBehind": true,
          "leftBehind": true,
          "mirrored": false
        },
        {
          "src": "assets/tactics/hero_ne_walk_03.webp",
          "right": [
            0.75,
            0.65
          ],
          "left": [
            0.56,
            0.59
          ],
          "rotation": 15,
          "rightBehind": true,
          "leftBehind": true,
          "mirrored": false
        },
        {
          "src": "assets/tactics/hero_ne_walk_04.webp",
          "right": [
            0.74,
            0.58
          ],
          "left": [
            0.56,
            0.57
          ],
          "rotation": 30,
          "rightBehind": true,
          "leftBehind": true,
          "mirrored": false
        },
        {
          "src": "assets/tactics/hero_ne_walk_05.webp",
          "right": [
            0.74,
            0.59
          ],
          "left": [
            0.56,
            0.57
          ],
          "rotation": 30,
          "rightBehind": true,
          "leftBehind": true,
          "mirrored": false
        },
        {
          "src": "assets/tactics/hero_ne_walk_06.webp",
          "right": [
            0.71,
            0.56
          ],
          "left": [
            0.56,
            0.57
          ],
          "rotation": 30,
          "rightBehind": true,
          "leftBehind": true,
          "mirrored": false
        }
      ]
    },
    "NW": {
      "idle": {
        "src": "assets/tactics/hero_nw_idle.webp",
        "right": [
          0.57575,
          0.53585
        ],
        "left": [
          0.31808,
          0.56988
        ],
        "rotation": -20,
        "rightBehind": true,
        "leftBehind": false,
        "mirrored": false,
        "flipImage": false
      },
      "walk-left": {
        "src": "assets/tactics/hero_nw_walk-left.webp",
        "right": [
          0.2846,
          0.6265
        ],
        "left": [
          0.4891,
          0.5733
        ],
        "rotation": -15,
        "rightBehind": true,
        "leftBehind": true,
        "mirrored": true
      },
      "walk-right": {
        "src": "assets/tactics/hero_nw_walk-right.webp",
        "right": [
          0.2971,
          0.5652
        ],
        "left": [
          0.5229,
          0.5971
        ],
        "rotation": -30,
        "rightBehind": true,
        "leftBehind": true,
        "mirrored": true
      },
      "windup": {
        "src": "assets/tactics/hero_nw_windup.webp",
        "right": [
          0.60633,
          0.30358
        ],
        "left": [
          0.29252,
          0.6256
        ],
        "rotation": 25,
        "rightBehind": true,
        "leftBehind": false,
        "mirrored": false,
        "flipImage": false
      },
      "strike": {
        "src": "assets/tactics/hero_nw_strike.webp",
        "right": [
          0.23789,
          0.32867
        ],
        "left": [
          0.36391,
          0.57522
        ],
        "rotation": -48,
        "rightBehind": true,
        "leftBehind": false,
        "mirrored": false,
        "flipImage": false
      },
      "guard": {
        "src": "assets/tactics/hero_nw_guard.webp",
        "right": [
          0.38787,
          0.59903
        ],
        "left": [
          0.30766,
          0.37968
        ],
        "rotation": -20,
        "rightBehind": true,
        "leftBehind": false,
        "mirrored": false,
        "flipImage": false
      },
      "hit": {
        "src": "assets/tactics/hero_nw_hit.webp",
        "right": [
          0.80563,
          0.59193
        ],
        "left": [
          0.34974,
          0.40984
        ],
        "rotation": 30,
        "rightBehind": true,
        "leftBehind": false,
        "mirrored": false,
        "flipImage": false
      },
      "down": {
        "src": "assets/tactics/hero_nw_down.webp",
        "right": [
          0.65946,
          0.68688
        ],
        "left": [
          0.1582,
          0.64086
        ],
        "rotation": -65,
        "rightBehind": true,
        "leftBehind": false,
        "mirrored": false,
        "flipImage": false
      },
      "walk": [
        {
          "src": "assets/tactics/hero_ne_walk_01.webp",
          "right": [
            0.25,
            0.65
          ],
          "left": [
            0.43999999999999995,
            0.59
          ],
          "rotation": -15,
          "rightBehind": true,
          "leftBehind": true,
          "mirrored": true,
          "flipImage": true
        },
        {
          "src": "assets/tactics/hero_ne_walk_02.webp",
          "right": [
            0.25,
            0.65
          ],
          "left": [
            0.43999999999999995,
            0.59
          ],
          "rotation": -15,
          "rightBehind": true,
          "leftBehind": true,
          "mirrored": true,
          "flipImage": true
        },
        {
          "src": "assets/tactics/hero_ne_walk_03.webp",
          "right": [
            0.25,
            0.65
          ],
          "left": [
            0.43999999999999995,
            0.59
          ],
          "rotation": -15,
          "rightBehind": true,
          "leftBehind": true,
          "mirrored": true,
          "flipImage": true
        },
        {
          "src": "assets/tactics/hero_ne_walk_04.webp",
          "right": [
            0.26,
            0.58
          ],
          "left": [
            0.43999999999999995,
            0.57
          ],
          "rotation": -30,
          "rightBehind": true,
          "leftBehind": true,
          "mirrored": true,
          "flipImage": true
        },
        {
          "src": "assets/tactics/hero_ne_walk_05.webp",
          "right": [
            0.26,
            0.59
          ],
          "left": [
            0.43999999999999995,
            0.57
          ],
          "rotation": -30,
          "rightBehind": true,
          "leftBehind": true,
          "mirrored": true,
          "flipImage": true
        },
        {
          "src": "assets/tactics/hero_ne_walk_06.webp",
          "right": [
            0.29000000000000004,
            0.56
          ],
          "left": [
            0.43999999999999995,
            0.57
          ],
          "rotation": -30,
          "rightBehind": true,
          "leftBehind": true,
          "mirrored": true,
          "flipImage": true
        }
      ]
    }
  },
  "equipment": {
    "sword": {
      "src": "assets/tactics/sword.webp",
      "pivot": [
        0.4969,
        0.8173
      ],
      "size": [
        157,
        512
      ]
    },
    "hammer": {
      "src": "assets/tactics/hammer.webp",
      "pivot": [
        0.502,
        0.721
      ],
      "size": [
        253,
        509
      ]
    },
    "shield": {
      "src": "assets/tactics/shield.webp",
      "pivot": [
        0.5015,
        0.5025
      ],
      "size": [
        333,
        396
      ]
    },
    "staff": {
      "src": "assets/tactics/staff.webp",
      "pivot": [
        0.5474,
        0.7741
      ],
      "size": [
        128,
        512
      ]
    }
  },
  "props": {
    "tree": {
      "src": "assets/tactics/tree.webp",
      "pivot": [
        0.5067,
        0.9369
      ],
      "size": [
        375,
        428
      ]
    },
    "rock": {
      "src": "assets/tactics/rock.webp",
      "pivot": [
        0.5,
        0.9394
      ],
      "size": [
        338,
        330
      ]
    },
    "stump": {
      "src": "assets/tactics/stump.webp",
      "pivot": [
        0.4972,
        0.9349
      ],
      "size": [
        354,
        292
      ]
    },
    "fence": {
      "src": "assets/tactics/fence.webp",
      "pivot": [
        0.512,
        0.9494
      ],
      "size": [
        334,
        356
      ]
    }
  }
};
// v41: imported walk sets live in the asset manifest, leaving the original sprite definitions intact.
(function(root){
 'use strict';
 function apply(t,manifest){
  if(!t?.directions)return;
  if(!t._studioBaseWalks)Object.defineProperty(t,'_studioBaseWalks',{value:Object.fromEntries(Object.entries(t.directions).map(([d,p])=>[d,JSON.parse(JSON.stringify(p.walk||[]))])),enumerable:false});
  if(!t._studioCreatedDirections)Object.defineProperty(t,'_studioCreatedDirections',{value:new Set(),enumerable:false});
  let requested=new Set([...Object.keys(manifest?.studioWalks||{}),...Object.keys(manifest?.studioWalkMirrors||{}),...Object.values(manifest?.studioWalkMirrors||{})]);
  for(let d of t._studioCreatedDirections)if(!requested.has(d)){delete t.directions[d];delete t._studioBaseWalks[d];t._studioCreatedDirections.delete(d)}
  for(let d of requested)if(['SE','SW','NE','NW','E','W'].includes(d)&&!t.directions[d]){t.directions[d]={idle:{...t.directions.SE.idle},walk:[]};t._studioBaseWalks[d]=[];t._studioCreatedDirections.add(d)}
  for(let [dir,base]of Object.entries(t._studioBaseWalks)){
   let config=manifest?.studioWalks?.[dir];
   if(!config?.frames?.length){t.directions[dir].walk=base;continue}
   t.directions[dir].walk=config.frames.map((f,i)=>({...((base.length?base[Math.round(i*(base.length-1)/Math.max(1,config.frames.length-1))]:t.directions[dir].idle)||{}),src:(manifest.assets||[]).find(a=>a.id===f.assetId)?.file||f.src,ms:Math.max(20,Number(f.ms)||80),flipImage:false,mirrored:false}));
  }
  for(let [target,source]of Object.entries(manifest?.studioWalkMirrors||{})){if(target===source||!t.directions[target]||!t.directions[source])continue;let src=t.directions[source].walk;if(!src?.length)continue;t.directions[target].walk=src.map(f=>({...f,flipImage:!f.flipImage,mirrored:!f.mirrored,right:f.right?[1-f.right[0],f.right[1]]:[.5,.5],left:f.left?[1-f.left[0],f.left[1]]:[.5,.5],rotation:-(f.rotation||0)}))}
 }
 function frame(frames,time){if(!frames?.length)return null;let total=frames.reduce((n,f)=>n+(Number(f.ms)||110),0),t=((time%total)+total)%total;for(let f of frames){let ms=Number(f.ms)||110;if(t<ms)return f;t-=ms}return frames.at(-1)}
 root.StudioWalks={apply,frame};apply(TACTICS_SPRITES,root.ASSET_MANIFEST);
})(globalThis);
