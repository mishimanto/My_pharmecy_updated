<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $title }}</title>
    <style>
        body { font-family: "DejaVu Sans", sans-serif; color: #0f172a; font-size: 11px; }
        .header { border-bottom: 2px solid #0f766e; padding-bottom: 12px; margin-bottom: 16px; }
        .brand { font-size: 20px; font-weight: 700; margin: 0; }
        .muted { color: #64748b; }
        .title { font-size: 16px; font-weight: 700; margin: 12px 0 4px; }
        .summary { width: 100%; border-collapse: collapse; margin: 12px 0 18px; }
        .summary td { border: 1px solid #cbd5e1; padding: 8px; }
        .summary .label { color: #475569; font-weight: 700; }
        .summary .value { font-size: 14px; font-weight: 700; }
        h2 { font-size: 13px; margin: 18px 0 8px; text-transform: capitalize; }
        table.data { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        table.data th { background: #f1f5f9; color: #334155; font-size: 9px; text-transform: uppercase; text-align: left; }
        table.data th, table.data td { border: 1px solid #cbd5e1; padding: 6px; vertical-align: top; }
        table.data td { color: #1e293b; }
        .empty { border: 1px solid #cbd5e1; padding: 10px; color: #64748b; }
    </style>
</head>
<body>
    <div class="header">
        <p class="brand">{{ $settings['site_name'] ?? 'My Pharmecy' }}</p>
        <div class="muted">{{ $settings['support_email'] ?? '' }}</div>
        <div class="title">{{ $title }}</div>
        <div class="muted">
            Generated: {{ now()->format('Y-m-d H:i') }}
            @if(!empty($filters['date_from']) || !empty($filters['date_to']))
                | Date range: {{ $filters['date_from'] ?? 'Start' }} to {{ $filters['date_to'] ?? 'Today' }}
            @endif
        </div>
    </div>

    <table class="summary">
        <tr>
            @foreach(($report['summary'] ?? []) as $index => $item)
                @if($index > 0 && $index % 4 === 0)
                    </tr><tr>
                @endif
                <td>
                    <div class="label">{{ $item['label'] ?? '-' }}</div>
                    <div class="value">{{ number_format((float) ($item['value'] ?? 0), 2) }}</div>
                </td>
            @endforeach
        </tr>
    </table>

    @foreach(($report['tables'] ?? []) as $section => $rows)
        @php
            $rows = collect($rows);
            $columns = $rows->take(10)->flatMap(fn ($row) => array_keys((array) $row))->unique()->take(8)->values();
        @endphp
        <h2>{{ str_replace('_', ' ', $section) }}</h2>
        @if($rows->isEmpty() || $columns->isEmpty())
            <div class="empty">No data found.</div>
        @else
            <table class="data">
                <thead>
                    <tr>
                        @foreach($columns as $column)
                            <th>{{ str_replace('_', ' ', $column) }}</th>
                        @endforeach
                    </tr>
                </thead>
                <tbody>
                    @foreach($rows as $row)
                        @php $row = (array) $row; @endphp
                        <tr>
                            @foreach($columns as $column)
                                <td>{{ is_scalar($row[$column] ?? null) ? $row[$column] : json_encode($row[$column] ?? null) }}</td>
                            @endforeach
                        </tr>
                    @endforeach
                </tbody>
            </table>
        @endif
    @endforeach
</body>
</html>
