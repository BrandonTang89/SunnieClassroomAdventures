
I want to build a web based HTML 5 game using Phaser, designed to be played on an ipad

The main part of the game will be similar to https://play.google.com/store/apps/details?id=com.nitrome.magictouch
But based on drawing greek letters instead of random symbols.

The left side of the screen will be the game area, and the right side will be the control area.

In the game area, we will have stars being carried away by balloons. Each star will be carried by between 1 and 5 balloons. These balloons will contain greek letters. 

In the control area, we will just have an empty space where the user can draw greek letters using the mouse / apple pencil.

there should be a button on the left side of the screen next to the control area to submit the drawing to be evaluated.

The stars and baloons should be randomly generated, with increasing speed. And there should be some lives, it should function like a token bucket, so if you lose more than say 5 balloons in 30 seconds, its game over (though this should be a parameter).

We should record the score you have after (where you get points from getting stars)

