// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract TodoList {
    struct Todo {
        uint256 id;
        string content;
        bool completed;
        uint256 dueDate;
        address owner;
        uint256 createdAt;
    }

    mapping(uint256 => Todo) public todos;
    mapping(address => uint256[]) public userTodos;
    uint256 public todoCount;

    event TodoCreated(
        uint256 indexed id,
        string content,
        uint256 dueDate,
        address indexed owner
    );

    event TodoUpdated(
        uint256 indexed id,
        string content,
        bool completed,
        uint256 dueDate
    );

    event TodoDeleted(uint256 indexed id, address indexed owner);

    modifier onlyTodoOwner(uint256 _id) {
        require(todos[_id].owner == msg.sender, "Not the owner of this todo");
        _;
    }

    function createTodo(string memory _content, uint256 _dueDate) public {
        todoCount++;
        todos[todoCount] = Todo(
            todoCount,
            _content,
            false,
            _dueDate,
            msg.sender,
            block.timestamp
        );

        userTodos[msg.sender].push(todoCount);

        emit TodoCreated(todoCount, _content, _dueDate, msg.sender);
    }

    function updateTodo(
        uint256 _id,
        string memory _content,
        bool _completed,
        uint256 _dueDate
    ) public onlyTodoOwner(_id) {
        Todo storage todo = todos[_id];
        todo.content = _content;
        todo.completed = _completed;
        todo.dueDate = _dueDate;

        emit TodoUpdated(_id, _content, _completed, _dueDate);
    }

    function toggleTodo(uint256 _id) public onlyTodoOwner(_id) {
        todos[_id].completed = !todos[_id].completed;

        emit TodoUpdated(
            _id,
            todos[_id].content,
            todos[_id].completed,
            todos[_id].dueDate
        );
    }

    function deleteTodo(uint256 _id) public onlyTodoOwner(_id) {
        require(todos[_id].id != 0, "Todo does not exist");

        // Remove from user's todo list
        uint256[] storage userTodoList = userTodos[msg.sender];
        for (uint256 i = 0; i < userTodoList.length; i++) {
            if (userTodoList[i] == _id) {
                userTodoList[i] = userTodoList[userTodoList.length - 1];
                userTodoList.pop();
                break;
            }
        }

        delete todos[_id];

        emit TodoDeleted(_id, msg.sender);
    }

    function getTodo(uint256 _id) public view returns (Todo memory) {
        return todos[_id];
    }

    function getUserTodos(address _user) public view returns (uint256[] memory) {
        return userTodos[_user];
    }

    function getUserTodoDetails(address _user) public view returns (Todo[] memory) {
        uint256[] memory userTodoIds = userTodos[_user];
        Todo[] memory userTodoList = new Todo[](userTodoIds.length);

        for (uint256 i = 0; i < userTodoIds.length; i++) {
            userTodoList[i] = todos[userTodoIds[i]];
        }

        return userTodoList;
    }

    function bulkCreateTodos(string[] memory _contents, uint256[] memory _dueDates) public {
        require(_contents.length == _dueDates.length, "Contents and due dates arrays must have the same length");
        require(_contents.length > 0, "Arrays cannot be empty");

        for (uint256 i = 0; i < _contents.length; i++) {
            todoCount++;
            todos[todoCount] = Todo(
                todoCount,
                _contents[i],
                false,
                _dueDates[i],
                msg.sender,
                block.timestamp
            );

            userTodos[msg.sender].push(todoCount);

            emit TodoCreated(todoCount, _contents[i], _dueDates[i], msg.sender);
        }
    }

    function bulkUpdateTodos(
        uint256[] memory _ids,
        string[] memory _contents,
        bool[] memory _completed,
        uint256[] memory _dueDates
    ) public {
        require(
            _ids.length == _contents.length &&
            _ids.length == _completed.length &&
            _ids.length == _dueDates.length,
            "All arrays must have the same length"
        );
        require(_ids.length > 0, "Arrays cannot be empty");

        for (uint256 i = 0; i < _ids.length; i++) {
            require(todos[_ids[i]].owner == msg.sender, "Not the owner of this todo");

            Todo storage todo = todos[_ids[i]];
            todo.content = _contents[i];
            todo.completed = _completed[i];
            todo.dueDate = _dueDates[i];

            emit TodoUpdated(_ids[i], _contents[i], _completed[i], _dueDates[i]);
        }
    }

    function bulkDeleteTodos(uint256[] memory _ids) public {
        require(_ids.length > 0, "Array cannot be empty");

        for (uint256 i = 0; i < _ids.length; i++) {
            require(todos[_ids[i]].id != 0, "Todo does not exist");
            require(todos[_ids[i]].owner == msg.sender, "Not the owner of this todo");

            // Remove from user's todo list
            uint256[] storage userTodoList = userTodos[msg.sender];
            for (uint256 j = 0; j < userTodoList.length; j++) {
                if (userTodoList[j] == _ids[i]) {
                    userTodoList[j] = userTodoList[userTodoList.length - 1];
                    userTodoList.pop();
                    break;
                }
            }

            delete todos[_ids[i]];

            emit TodoDeleted(_ids[i], msg.sender);
        }
    }
}