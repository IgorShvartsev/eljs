<?php
define('PER_PAGE_DEFAULT', 7);

session_start();

$headers = [
    ['id' => 135, 'field' => 'email', 'name' => 'Email', 'type' => 'email', 'order' => 0, 'required' => 1, 'width' => '200', 'sortable' => 1, 'element' => '<input type="text" name="data[email]" value="" />'],
    ['id' => 136, 'field' => 'married', 'name' => 'Married', 'type' => 'yesno', 'order' => 1, 'required' => 0, 'width' => '200', 'sortable' => 0, 'element' => '<div class="radio"><input type="radio" name="data[married]" value="yes" /> yes <input type="radio" name="data[married]" value="no" /> no </div>'],
    ['id' => 137, 'field' => 'first_name', 'name' => 'Name', 'type' => 'text', 'order' => 2, 'required' => 0, 'width' => '200', 'sortable' => 1, 'element' => '<input type="text" name="data[first_name]" value="" />'],
    ['id' => 138, 'field' => 'last_name', 'name' => 'Last Name', 'type' => 'text', 'order' => 3, 'required' => 0, 'width' => '200', 'sortable' => 1, 'element' => '<input type="text" name="data[last_name]" value="" />'],
    ['id' => 139, 'field' => 'role', 'name' => 'Role', 'type' => 'select', 'order' => 4, 'required' => 0, 'width' => '200', 'sortable' => 1, 'element' => '<select name="data[role]"><option value="Regular">Regular</option><option value="Manager">Manager</option><option value="Specialist">Specialist</option></select>'],
];

$dataset = [
    '322-row' => ['test1@test.com', 'no', 'Edward', 'Franklin', 'Regular'],
    '323-row' => ['test2@test.com', 'no', 'Tiago', 'Newton', 'Regular'],
    '324-row' => ['test3@test.com', 'yes', 'Rohan', 'Sweeney', 'Regular'], 
    '325-row' => ['test4@test.com', 'no', 'Anya', 'Olsen', 'Manager'],
    '326-row' => ['test5@test.com', 'no', 'Skyla', 'Lowery', 'Specialist'],
    '327-row' => ['test6@test.com', 'yes', 'Michaela', 'Lewis', 'Regular'], 
    '328-row' => ['test7@test.com', 'no', 'Tallulah', 'Hahn', 'Manager'],
    '329-row' => ['test8@test.com', 'no', 'Marcel', 'Wiggins', 'Specialist'],
    '330-row' => ['test9@test.com', 'yes', 'Tianna', 'Villarreal', 'Regular'], 
    '332-row' => ['test10@test.com', 'no', 'Prince', 'Johns', 'Regular'],
    '333-row' => ['test11@test.com', 'no', 'Abdur', 'Arnold', 'Regular'],
    '334-row' => ['test12@test.com', 'yes', 'Ayah', 'Vang', 'Regular'], 
    '335-row' => ['test13@test.com', 'no', 'Bryn', 'Frederick', 'Manager'],
    '336-row' => ['test14@test.com', 'no', 'Karen', 'Graham', 'Specialist'],
    '337-row' => ['test15@test.com', 'yes', 'India', 'Weaver', 'Regular'], 
    '338-row' => ['test16@test.com', 'no', 'Francesco', 'Shaffer', 'Regular'],
    '339-row' => ['test17@test.com', 'no', 'Isla', 'Faulkner',  'Regular'],
    '340-row' => ['test18@test.com', 'yes', 'Myles', 'Cook', 'Regular'],
    '341-row' => ['test19@test.com', 'yes', 'Lia', 'Armstrong', 'Regular'],
    '342-row' => ['test20@test.com', 'yes', 'Elliot', 'Bright', 'Regular'],
    '343-row' => ['test21@test.com', 'no', 'Harr', 'Russo', 'Regular'],
    '344-row' => ['test22@test.com', 'yes', 'Nikodem', 'Carney', 'Regular'],
    '345-row' => ['test23@test.com', 'yes', 'Josie', 'Kelly', 'Regular'],
    '346-row' => ['test24@test.com', 'yes', 'Ada', 'Dyer', 'Regular'],
    '347-row' => ['test25@test.com', 'yes', 'Rabia', 'Garner', 'Regular'],
    '348-row' => ['test26@test.com', 'no', 'Kai', 'Hartman', 'Regular'],
    '349-row' => ['test27@test.com', 'yes', 'Kaitlyn', 'Hancock', 'Manager'],
    '350-row' => ['test28@test.com', 'no', 'Illa', 'Humphrey', 'Specialist'],
];

$response = [];
$limit = !empty($_GET['data']['perpage']) && $_GET['data']['perpage'] < 20 
    ? (int)$_GET['data']['perpage'] 
    : PER_PAGE_DEFAULT;

if (!empty($_SESSION['dataset'])) {
    $dataset = array_merge($dataset, $_SESSION['dataset']);
}

if (isset($_GET['data']['page'])) {
    $page = (int)$_GET['data']['page'];
    if (!$page) {
        $page = 1;
        $response['perpage'] = $limit;
        $response['total'] = count($dataset);
        $response['thead'] = $headers;
        $_SESSION['column_order'] = array_keys($headers);
    }

    if (!empty($_GET['data']['search'])) {
        $data = $_GET['data'];
        $dataset = array_filter($dataset, function ($row) use ($data) {
            $searchString = implode('', $row);
            return stripos($searchString, $data['search']) !== false;
        });

        if (empty($_SESSION['search']) || $_SESSION['search'] !== $_GET['data']['search']) {
            $_SESSION['search'] = $_GET['data']['search'];
            $page = 1;
            $response['total'] = count($dataset);
        }   
    } elseif(!empty($_SESSION['search'])) {
        unset($_SESSION['search']);
        $response['total'] = count($dataset);
    }

    $response['page'] = $page;
    $offset = ($page - 1) * $limit;
    $dataset = array_slice($dataset, $offset, $limit, true);

    foreach ($dataset as $key => &$row) {
        $orderedRow = [];
        foreach ($_SESSION['column_order'] as $index) {
            $orderedRow[] = $row[$index];
        }
        $row = $orderedRow;
    }

    $response['tbody'] = $dataset;
}

if (!empty($_GET['action'])) {
    switch($_GET['action']) {
        case 'column_order':
            $keys = [];
            foreach ($_POST['s'] as $val) {
                $keys[] = array_search($val, array_column($headers, 'id'));
            }
            $_SESSION['column_order'] = $keys;
            $response['status'] = 'success';
            break;
        case 'save':
            if (!empty($_POST['data'])) {
                $data = $_POST['data'];
                $key = array_search($data['field'], array_column($headers, 'field'));
                $entry = $dataset[$data['id'] . '-row'];
                $entry[$key] = $data['value'];
                $_SESSION['dataset'][$data['id'] . '-row'] = $entry;
            }
            $response['status'] = 'success';
            break;
    }
}

echo json_encode($response);
 