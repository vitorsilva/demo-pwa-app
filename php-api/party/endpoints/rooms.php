<?php
/**
 * Room API Endpoint
 *
 * Handles room CRUD operations:
 * - POST   /rooms              Create a new room
 * - GET    /rooms/{code}       Get room info
 * - POST   /rooms/{code}/join  Join a room
 * - POST   /rooms/{code}/leave Leave a room
 * - POST   /rooms/{code}/start Start the quiz (host only)
 * - POST   /rooms/{code}/quiz  Update quiz data (host only)
 * - DELETE /rooms/{code}       End room (host only)
 */

require_once __DIR__ . '/../ApiHelper.php';
require_once __DIR__ . '/../RoomManager.php';

// Load config and set up CORS
$config = require __DIR__ . '/../config.php';
ApiHelper::setupCors($config);

try {
    $roomManager = new RoomManager();
    $method = ApiHelper::getMethod();
    $pathInfo = $_SERVER['PATH_INFO'] ?? '';
    $segments = ApiHelper::parsePath($pathInfo);

    // Route: POST /rooms - Create room
    if ($method === 'POST' && count($segments) === 0) {
        $body = ApiHelper::getJsonBody();
        $hostId = ApiHelper::requireField($body, 'hostId');
        $hostName = $body['hostName'] ?? null;  // Optional for P2P mode
        $quizData = $body['quizData'] ?? null;  // Optional for P2P mode
        $secondsPerQuestion = $body['secondsPerQuestion'] ?? null;

        $room = $roomManager->createRoom($hostId, $hostName, $quizData, $secondsPerQuestion);
        ApiHelper::success($room, 201);
    }

    // Route: GET /rooms/{code} - Get room
    if ($method === 'GET' && count($segments) === 1) {
        $code = $segments[0];
        $room = $roomManager->getRoomByCode($code);

        if (!$room) {
            ApiHelper::error('Room not found', 404, 'ROOM_NOT_FOUND');
        }

        ApiHelper::success($room);
    }

    // Route: POST /rooms/{code}/join - Join room
    if ($method === 'POST' && count($segments) === 2 && $segments[1] === 'join') {
        $code = $segments[0];
        $body = ApiHelper::getJsonBody();
        $participantId = ApiHelper::requireField($body, 'participantId');
        $name = $body['name'] ?? null;  // Optional for P2P mode

        $room = $roomManager->joinRoom($code, $participantId, $name);
        ApiHelper::success($room);
    }

    // Route: POST /rooms/{code}/leave - Leave room
    if ($method === 'POST' && count($segments) === 2 && $segments[1] === 'leave') {
        $code = $segments[0];
        $body = ApiHelper::getJsonBody();
        $participantId = ApiHelper::requireField($body, 'participantId');

        $roomManager->leaveRoom($code, $participantId);
        ApiHelper::success(['left' => true]);
    }

    // Route: POST /rooms/{code}/start - Start quiz
    if ($method === 'POST' && count($segments) === 2 && $segments[1] === 'start') {
        $code = $segments[0];
        $body = ApiHelper::getJsonBody();
        $hostId = ApiHelper::requireField($body, 'hostId');

        $room = $roomManager->startQuiz($code, $hostId);
        ApiHelper::success($room);
    }

    // Route: POST /rooms/{code}/quiz - Update quiz data
    if ($method === 'POST' && count($segments) === 2 && $segments[1] === 'quiz') {
        $code = $segments[0];
        $body = ApiHelper::getJsonBody();
        $hostId = ApiHelper::requireField($body, 'hostId');
        $quizData = ApiHelper::requireField($body, 'quizData');

        $room = $roomManager->updateQuizData($code, $hostId, $quizData);
        ApiHelper::success($room);
    }

    // Route: DELETE /rooms/{code} - End room
    if ($method === 'DELETE' && count($segments) === 1) {
        $code = $segments[0];
        $body = ApiHelper::getJsonBody();
        $hostId = ApiHelper::requireField($body, 'hostId');

        $roomManager->endRoom($code, $hostId);
        ApiHelper::success(['ended' => true]);
    }

    // Route: POST /rooms/{code}/next - Advance to next question (host only)
    if ($method === 'POST' && count($segments) === 2 && $segments[1] === 'next') {
        $code = $segments[0];
        $body = ApiHelper::getJsonBody();
        $hostId = ApiHelper::requireField($body, 'hostId');

        $room = $roomManager->advanceQuestion($code, $hostId);
        ApiHelper::success($room);
    }

    // Route: POST /rooms/{code}/answer - Submit answer
    // DEPRECATED: In P2P mode, answers go directly to host via WebRTC.   
    // This endpoint remains for HTTP fallback mode only.
    if ($method === 'POST' && count($segments) === 2 && $segments[1] === 'answer') {
        $code = $segments[0];
        $body = ApiHelper::getJsonBody();
        $participantId = ApiHelper::requireField($body, 'participantId'); 
        $questionIndex = (int) ApiHelper::requireField($body, 'questionIndex');
        $answerIndex = (int) ($body['answerIndex'] ?? -1);
        $timeMs = (int) ($body['timeMs'] ?? 0);

        $result = $roomManager->submitAnswer($code, $participantId, $questionIndex, $answerIndex, $timeMs);
        $result['_fallback'] = true;  // Flag for telemetry tracking      
        ApiHelper::success($result);
    }

    // No matching route
    ApiHelper::error('Not found', 404, 'NOT_FOUND');

} catch (Exception $e) {
    $statusCode = $e->getCode();

    // Ensure valid HTTP status code
    if ($statusCode < 400 || $statusCode > 599) {
        $statusCode = 500;
    }

    ApiHelper::error($e->getMessage(), $statusCode);
}
