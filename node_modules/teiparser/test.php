<?php
    $file = file_get_contents('./test.json');
    $json = json_decode($file);
    print_r($json);
?>